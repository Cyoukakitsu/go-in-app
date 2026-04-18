'use server'

import { OpenRouter } from '@openrouter/sdk'

// pdf-parse v2 の新しいAPI
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PDFParse } = require('pdf-parse') as { PDFParse: new (opts: { data: Buffer }) => { getText: () => Promise<{ text: string }>; destroy: () => Promise<void> } }

// 試験回（第1次・第2次など）ごとの日程
export interface ExamSession {
  session_name: string | null  // 例: "第1次（夏季）"、"第2次（春季）"
  application_start: string | null
  application_end: string | null
  exam_date: string | null
  interview_date: string | null
  result_date: string | null
}

// 研究科・専攻ごとの1エントリ
export interface ParsedScheduleEntry {
  department: string | null
  specialization: string | null
  sessions: ExamSession[]
}

// PDF全体のパース結果
export interface ParsedPdfData {
  university_name: string | null
  university_type: '国公立' | '私立' | null
  schedules: ParsedScheduleEntry[]
}

export type ParseResult =
  | { success: true; data: ParsedPdfData }
  | { success: false; error: string }

const client = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY ?? '',
})

const SYSTEM_PROMPT = `あなたは日本の大学院入試の募集要項PDFから日程情報を正確に抽出するアシスタントです。
以下のJSONフォーマットで、全ての研究科・専攻・試験回の情報を漏れなく返してください。

{
  "university_name": "大学名（日本語）",
  "university_type": "国公立" または "私立"（国立大学・公立大学は「国公立」、私立大学は「私立」）,
  "schedules": [
    {
      "department": "研究科名（例：経済学研究科）",
      "specialization": "専攻名（例：経済学専攻）。専攻の記載がない場合はnull",
      "sessions": [
        {
          "session_name": "試験回の名称（例：「第1次募集」「夏季入試」「A日程」「前期」。記載がない場合はnull）",
          "application_start": "出願受付開始日（YYYY-MM-DD）",
          "application_end": "出願受付締切日／出願期間終了日（YYYY-MM-DD）",
          "exam_date": "筆記試験日／学力試験日／一次試験日（YYYY-MM-DD）",
          "interview_date": "口述試験日／面接試験日／二次試験日（YYYY-MM-DD）",
          "result_date": "合格発表日／選考結果通知日（YYYY-MM-DD）"
        }
      ]
    }
  ]
}

【重要な抽出ルール】
1. schedulesには全ての研究科・専攻を含める。省略厳禁。
2. sessionsには全ての試験回（第1次・第2次、夏季・冬季、前期・後期など）を全て含める。
3. 試験回が1回のみの場合もsessions配列に1要素として必ず含める。
4. 日付の抽出について：
   - 「出願期間」「出願受付」「願書受付」→ application_start / application_end
   - 「筆記試験」「学力試験」「専門科目試験」「一次試験」→ exam_date
   - 「口述試験」「面接試験」「口頭試問」「二次試験」→ interview_date
   - 「合格発表」「選考結果通知」「結果通知」→ result_date
   - 期間で記載されている場合（例：「4月1日〜4月5日」）→ 開始日をapplication_start、終了日をapplication_endに入れる
   - 「〇月上旬」「〇月中旬」「〇月下旬」のような場合→ 上旬=1日、中旬=15日、下旬=25日として変換する
5. 日付は必ずYYYY-MM-DD形式に変換する。
   - 令和1年=2019年、令和2年=2020年、令和3年=2021年、令和4年=2022年
   - 令和5年=2023年、令和6年=2024年、令和7年=2025年、令和8年=2026年
6. 情報が見当たらない場合のみnullを返す。テキストに記載がある日付は必ず抽出すること。
7. university_typeが判断できない場合はnullを返す。
8. 必ずJSONのみを返し、説明文・コードブロック記号は不要。`

// 日程情報を含む箇所を優先的に抽出する
function extractScheduleText(fullText: string): string {
  const HEADER_CHARS = 2000   // 先頭（大学名・研究科情報）
  const SCHEDULE_WINDOW = 600 // キーワード周辺の前後文字数
  const MAX_TOTAL = 12000     // 最大送信文字数

  // 日程関連キーワード
  const SCHEDULE_KEYWORDS = [
    '出願', '願書', '筆記試験', '学力試験', '専門科目',
    '口述試験', '面接試験', '口頭試問', '二次試験',
    '合格発表', '選考結果', '結果通知',
    '第1次', '第2次', '第一次', '第二次',
    '夏季', '冬季', '春季', '秋季',
    '令和', '年月日', '月　日',
  ]

  const header = fullText.slice(0, HEADER_CHARS)
  if (fullText.length <= MAX_TOTAL) return fullText

  // キーワードが含まれる行の周辺テキストを収集
  const lines = fullText.split('\n')
  const collected: Set<number> = new Set()

  lines.forEach((line, i) => {
    if (SCHEDULE_KEYWORDS.some((kw) => line.includes(kw))) {
      for (let j = Math.max(0, i - 3); j <= Math.min(lines.length - 1, i + 5); j++) {
        collected.add(j)
      }
    }
  })

  const scheduleSection = Array.from(collected)
    .sort((a, b) => a - b)
    .map((i) => lines[i])
    .join('\n')

  // 先頭 + 日程セクションを結合（重複を避けつつ上限内に収める）
  const combined = header + '\n\n【日程情報】\n' + scheduleSection
  return combined.slice(0, MAX_TOTAL)
}

export async function parsePdfAction(formData: FormData): Promise<ParseResult> {
  const file = formData.get('file')

  if (!file || typeof file === 'string') {
    return { success: false, error: 'ファイルが選択されていません' }
  }

  const MAX_PDF_BYTES = 10 * 1024 * 1024
  if (file.size > MAX_PDF_BYTES) {
    return { success: false, error: 'ファイルサイズが10MBを超えています' }
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return { success: false, error: 'AI解析に失敗しました。手動入力をお試しください' }
  }

  let extractedText: string
  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const parser = new PDFParse({ data: buffer })
    const pdfData = await parser.getText()
    await parser.destroy()
    extractedText = pdfData.text

    if (!extractedText || extractedText.trim().length === 0) {
      return {
        success: false,
        error: 'PDFのテキストを読み取れませんでした（画像PDFの可能性があります）',
      }
    }
  } catch {
    return {
      success: false,
      error: 'PDFのテキストを読み取れませんでした（画像PDFの可能性があります）',
    }
  }

  const truncatedText = extractScheduleText(extractedText)

  try {
    const response = await client.chat.send({
      chatRequest: {
        model: 'deepseek/deepseek-chat',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `以下の大学院募集要項テキストから、全ての日程情報を漏れなく抽出してください。筆記試験日・面接日・合格発表日を特に注意して抽出してください。\n\n${truncatedText}` },
        ] as any,
      },
    })

    if (!('choices' in response)) {
      return { success: false, error: 'AI解析に失敗しました。手動入力をお試しください' }
    }
    const content = response.choices[0]?.message?.content
    if (!content) {
      return { success: false, error: 'AI解析に失敗しました。手動入力をお試しください' }
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/)
    const jsonStr = jsonMatch ? jsonMatch[0] : content
    const parsed: unknown = JSON.parse(jsonStr)

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return { success: false, error: 'AI解析に失敗しました。手動入力をお試しください' }
    }

    const data = parsed as ParsedPdfData
    if (!Array.isArray(data.schedules) || data.schedules.length === 0) {
      return { success: false, error: 'AI解析に失敗しました。手動入力をお試しください' }
    }

    return { success: true, data }
  } catch {
    return { success: false, error: 'AI解析に失敗しました。手動入力をお試しください' }
  }
}
