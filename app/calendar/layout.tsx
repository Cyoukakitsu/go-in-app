// Server Actionsのタイムアウトを60秒に延長（PDF解析＋AI処理のため）
export const maxDuration = 60;

export default function CalendarLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
