// YYYY-MM-DD を YYYY年M月D日 形式に変換する
export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  return `${year}年${parseInt(month)}月${parseInt(day)}日`
}
