// scripts/scrape-jpss.mjs
// jpss.jp から大学院の入試日程をスクレイピングして Supabase に登録する
// 実行: node scripts/scrape-jpss.mjs
// 環境変数: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BASE_URL = 'https://www.jpss.jp';
const SITEMAP_URL = `${BASE_URL}/sitemap1.xml`;
const DELAY_MS = 500;           // リクエスト間の待機時間（レート制限対策）
const REQUEST_TIMEOUT_MS = 10_000;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('環境変数 SUPABASE_URL または SUPABASE_SERVICE_ROLE_KEY が設定されていません');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * 日本語日付文字列を ISO 形式に変換
 * 例: "2025年7月16日" → "2025-07-16"
 */
function parseJpDate(str) {
  const m = str.trim().match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (!m) return null;
  return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
}

/** タイムアウト付きで HTML を取得 */
async function fetchHtml(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'GradSchoolBot/1.0 (educational; monthly batch)',
      },
    });
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 大学トップページをパース → { name_ja, type }
 * URL: /ja/grad/{uni_id}/
 */
function parseUniversityPage(html) {
  const $ = cheerio.load(html);

  // <h2><span itemprop="name">北海道大学</span></h2>
  const name_ja = $('h2 [itemprop="name"]').first().text().trim();

  // "北海道 / 国立" のようなパターンを探す
  let type = '私立'; // デフォルト
  $('p, div').each((_, el) => {
    const text = $(el).text();
    if (/\/\s*国立/.test(text)) { type = '国立'; return false; }
    if (/\/\s*公立/.test(text)) { type = '公立'; return false; }
  });

  return { name_ja, type };
}

/**
 * コースページをパース → 入試ラウンドの配列
 * URL: /ja/grad/{uni_id}/{course_id}/
 * 返り値: [{ department, application_start, application_end, exam_date, result_date }]
 */
function parseCoursePage(html) {
  const $ = cheerio.load(html);

  // <h3 itemprop="name">文学院</h3>
  const department = $('[itemprop="department"] h3[itemprop="name"]').first().text().trim();
  if (!department) return [];

  const results = [];
  let current = {};

  // <th> ラベルと <td> 値のペアをスキャン
  $('table tr').each((_, row) => {
    const th = $(row).find('th').text().trim();
    const td = $(row).find('td').text().trim();

    switch (th) {
      case '出願期間開始日':
        current.application_start = parseJpDate(td);
        break;
      case '出願期間終了日':
        current.application_end = parseJpDate(td);
        break;
      case '試験日':
        current.exam_date = parseJpDate(td);
        break;
      case '合格発表日':
        current.result_date = parseJpDate(td);
        // 合格発表日が出たら 1 ラウンド完結
        if (current.application_start || current.exam_date) {
          results.push({ department, ...current });
        }
        current = {};
        break;
    }
  });

  return results;
}

async function main() {
  console.log('=== jpss.jp スクレイピング開始 ===');
  console.log(`開始時刻: ${new Date().toISOString()}`);

  // 1. sitemap1.xml から /ja/grad/ URL を全抽出
  console.log('\nサイトマップ取得中...');
  const sitemapXml = await fetchHtml(SITEMAP_URL);

  // コースURL: /ja/grad/{uni_id}/{course_id}/
  const courseRegex = /https:\/\/www\.jpss\.jp\/ja\/grad\/(\d+)\/(\d+)\//g;
  // 大学URL: /ja/grad/{uni_id}/
  const uniRegex = /https:\/\/www\.jpss\.jp\/ja\/grad\/(\d+)\//g;

  const universityIds = new Set();
  const courseEntries = []; // { uniId, courseId }

  for (const m of sitemapXml.matchAll(courseRegex)) {
    universityIds.add(m[1]);
    courseEntries.push({ uniId: m[1], courseId: m[2] });
  }
  for (const m of sitemapXml.matchAll(uniRegex)) {
    universityIds.add(m[1]);
  }

  console.log(`大学数: ${universityIds.size}, コース数: ${courseEntries.length}`);

  // 2. 各大学ページをスクレイピング → universities テーブルに登録
  console.log('\n--- 大学情報を取得中 ---');
  const uniIdMap = new Map(); // jpss uniId → supabase uuid

  for (const uniId of universityIds) {
    try {
      const html = await fetchHtml(`${BASE_URL}/ja/grad/${uniId}/`);
      const { name_ja, type } = parseUniversityPage(html);

      if (!name_ja) {
        console.warn(`[SKIP] 大学ID ${uniId}: 名前が取得できなかった`);
        await sleep(DELAY_MS);
        continue;
      }

      // name_ja で既存レコードを検索
      const { data: existing } = await supabase
        .from('universities')
        .select('id')
        .eq('name_ja', name_ja)
        .maybeSingle();

      let supabaseId;
      if (existing) {
        // 既存レコード → type を更新
        await supabase.from('universities').update({ type }).eq('id', existing.id);
        supabaseId = existing.id;
      } else {
        // 新規挿入
        const { data: inserted, error } = await supabase
          .from('universities')
          .insert({ name_ja, name_zh: '', type, departments: [] })
          .select('id')
          .single();
        if (error) {
          console.error(`[ERROR] 大学挿入失敗 "${name_ja}":`, error.message);
          await sleep(DELAY_MS);
          continue;
        }
        supabaseId = inserted.id;
      }

      uniIdMap.set(uniId, supabaseId);
      console.log(`✓ ${name_ja} (${type})`);
    } catch (e) {
      console.error(`[ERROR] 大学ID ${uniId}:`, e.message);
    }
    await sleep(DELAY_MS);
  }

  console.log(`\n大学登録完了: ${uniIdMap.size} 件`);

  // 3. 対象大学の既存スケジュールを一括削除（再スクレイピング時の重複防止）
  const supabaseUniIds = [...uniIdMap.values()];
  if (supabaseUniIds.length > 0) {
    const { error } = await supabase
      .from('university_schedules')
      .delete()
      .in('university_id', supabaseUniIds);
    if (error) {
      console.error('[ERROR] 既存スケジュール削除失敗:', error.message);
    } else {
      console.log(`既存スケジュール削除完了 (${supabaseUniIds.length} 大学分)`);
    }
  }

  // 4. 各コースページをスクレイピング → university_schedules テーブルに登録
  console.log('\n--- 入試日程を取得中 ---');
  let successCount = 0;
  let errorCount = 0;

  for (const { uniId, courseId } of courseEntries) {
    const supabaseUniId = uniIdMap.get(uniId);
    if (!supabaseUniId) continue;

    try {
      const url = `${BASE_URL}/ja/grad/${uniId}/${courseId}/`;
      const html = await fetchHtml(url);
      const schedules = parseCoursePage(html);

      if (schedules.length === 0) {
        await sleep(DELAY_MS);
        continue;
      }

      const rows = schedules.map((s) => ({
        university_id: supabaseUniId,
        department: s.department,
        application_start: s.application_start,
        application_end: s.application_end,
        exam_date: s.exam_date,
        result_date: s.result_date,
        year: s.exam_date
          ? parseInt(s.exam_date.split('-')[0])
          : new Date().getFullYear(),
        tags: [],
      }));

      const { error } = await supabase.from('university_schedules').insert(rows);
      if (error) {
        console.error(`[ERROR] スケジュール挿入失敗 ${uniId}/${courseId}:`, error.message);
        errorCount++;
      } else {
        console.log(`  ✓ ${schedules[0].department} (${schedules.length} ラウンド)`);
        successCount++;
      }
    } catch (e) {
      console.error(`[ERROR] コース ${uniId}/${courseId}:`, e.message);
      errorCount++;
    }
    await sleep(DELAY_MS);
  }

  console.log('\n=== スクレイピング完了 ===');
  console.log(`成功: ${successCount} コース, エラー: ${errorCount} コース`);
  console.log(`終了時刻: ${new Date().toISOString()}`);
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
