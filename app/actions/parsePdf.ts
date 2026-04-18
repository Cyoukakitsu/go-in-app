'use server'

import OpenAI from 'openai'

// pdf-parse v2 の新しいAPI
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PDFParse } = require('pdf-parse') as { PDFParse: new (opts: { data: Buffer }) => { getText: () => Promise<{ text: string }>; destroy: () => Promise<void> } }

export interface ParsedSchedule {
  university_name: string | null
  university_type: '国公立' | '私立' | null
  department: string | null
  application_start: string | null
  application_end: string | null
  exam_date: string | null
  interview_date: string | null
  result_date: string | null
}

export type ParseResult =
  | { success: true; data: ParsedSchedule }
  | { success: false; error: string }

// OpenAIクライアントをモジュールスコープで初期化（関数呼び出しごとの再生成を避ける）
const client = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY ?? '',
})

const SYSTEM_PROMPT = `あなたは日本の大学院募集要項PDFから入試日程情報を抽出するアシスタントです。
テキストを分析し、以下のJSONフォーマットで情報を返してください。

{
  "university_name": "大学名（日本語）",
  "university_type": "国公立" または "私立"（国立・公立大学は「国公立」、私立大学は「私立」）,
  "department": "研究科名または専攻名",
  "application_start": "出願開始日（YYYY-MM-DD形式）",
  "application_end": "出願締切日（YYYY-MM-DD形式）",
  "exam_date": "試験日（YYYY-MM-DD形式）",
  "interview_date": "面接日（YYYY-MM-DD形式）",
  "result_date": "合格発表日（YYYY-MM-DD形式）"
}

ルール：
- 日付は必ずYYYY-MM-DD形式に変換する（例：「令和8年4月1日」→「2026-04-01」、「2026年4月1日」→「2026-04-01」）
- 令和1年=2019年、令和6年=2024年、令和7年=2025年、令和8年=2026年
- 情報が見つからない場合はnullを返す
- university_typeが判断できない場合はnullを返す
- 必ずJSONのみを返し、説明文は不要`

export async function parsePdfAction(formData: FormData): Promise<ParseResult> {
  const file = formData.get('file')

  console.log('[parsePdf] file=', file, 'type=', typeof file, 'instanceof Blob=', file instanceof Blob, 'instanceof File=', typeof File !== 'undefined' && file instanceof File)
  if (!file || typeof file === 'string') {
    return { success: false, error: 'ファイルが選択されていません' }
  }

  // サーバーサイドでファイルサイズを検証（10MB上限）
  const MAX_PDF_BYTES = 10 * 1024 * 1024 // 10 MB
  if (file.size > MAX_PDF_BYTES) {
    return { success: false, error: 'ファイルサイズが10MBを超えています' }
  }

  console.log('[parsePdf] DEEPSEEK_API_KEY=', process.env.DEEPSEEK_API_KEY ? `set(${process.env.DEEPSEEK_API_KEY.slice(0, 8)}...)` : 'NOT SET')
  if (!process.env.DEEPSEEK_API_KEY) {
    return { success: false, error: 'AI解析に失敗しました。手動入力をお試しください' }
  }

  // PDFをBufferに変換してテキスト抽出
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

  // テキストが長すぎる場合は最初の8000文字に制限（DeepSeekのトークン節約）
  const truncatedText = extractedText.slice(0, 8000)

  // DeepSeek APIを呼び出す
  try {
    const response = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `以下の募集要項テキストから情報を抽出してください：\n\n${truncatedText}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      return { success: false, error: 'AI解析に失敗しました。手動入力をお試しください' }
    }

    // 型安全なJSONパース（構造ガードを追加）
    const parsed: unknown = JSON.parse(content)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return { success: false, error: 'AI解析に失敗しました。手動入力をお試しください' }
    }
    return { success: true, data: parsed as ParsedSchedule }
  } catch {
    return { success: false, error: 'AI解析に失敗しました。手動入力をお試しください' }
  }
}
