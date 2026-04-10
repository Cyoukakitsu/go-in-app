import { SchoolCard } from "@/features/dashboard/components/SchoolCard";
import { SearchFilters } from "@/features/dashboard/components/SearchFilters";
import { createServerClient } from "@/shared/lib/supabase/server";
import { School } from "lucide-react";
import { Suspense } from "react";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function DashboardPage(props: {
  searchParams: SearchParams;
}) {
  const searchParams = await props.searchParams;
  const query = ((searchParams.q as string) || "").trim();
  const type = (searchParams.type as string) || "all";

  const supabase = await createServerClient();

  // universitiesとuniversity_schedulesを結合して取得
  let dbQuery = supabase
    .from("universities")
    .select(
      `
      id,
      name_ja,
      name_zh,
      type,
      university_schedules (
        id,
        department,
        application_start,
        application_end,
        exam_date,
        interview_date,
        result_date,
        tags,
        year
      )
    `,
    )
    .order("name_ja");

  // カテゴリフィルタ
  if (type === "public") {
    dbQuery = dbQuery.in("type", ["国立", "公立", "国公立"]);
  } else if (type === "private") {
    dbQuery = dbQuery.eq("type", "私立");
  }

  // テキスト検索（学校名 or 中国語名）
  if (query) {
    dbQuery = dbQuery.or(`name_ja.ilike.%${query}%,name_zh.ilike.%${query}%`);
  }

  const { data: universities, error } = await dbQuery;

  if (error) {
    console.error("大学データの取得に失敗しました:", error.message);
  }

  // SchoolCardが期待する形式に変換
  const formattedUniversities = (universities ?? []).map((uni) => ({
    id: uni.id,
    name_ja: uni.name_ja,
    name_zh: uni.name_zh,
    type: uni.type,
    schedules: (uni.university_schedules ?? []).map((s) => ({
      id: s.id,
      department: s.department,
      application_start: s.application_start ?? "",
      application_end: s.application_end ?? "",
      exam_date: s.exam_date ?? "",
      interview_date: s.interview_date ?? "",
      result_date: s.result_date ?? "",
      tags: s.tags ?? [],
    })),
  }));

  return (
    <div className="min-h-screen bg-bg-main pt-20 md:pt-24">
      {/* Header Section */}
      <header className="pt-16 pb-24 px-6 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-primary/5 text-primary rounded-full px-4 py-2 text-sm font-bold mb-6">
          <School className="w-4 h-4" />
          <span>志望校管理ツール — GO院</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-serif text-text-main mb-6 leading-tight">
          憧れの大学院への
          <br />
          第一歩を、もっと軽やかに。
        </h1>
        <p className="text-text-sub text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
          最新の出願日程・試験情報を一元管理。
          <br />
          スケジュールを可視化して、重複や漏れのない受験戦略を。
        </p>
      </header>

      {/* Main Dashboard Section */}
      <main className="px-6 max-w-7xl mx-auto pb-32">
        <Suspense fallback={<div>Loading filters...</div>}>
          <SearchFilters />
        </Suspense>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
          {formattedUniversities.length > 0 ? (
            formattedUniversities.map((university) => (
              <SchoolCard key={university.id} university={university} />
            ))
          ) : (
            <div className="col-span-full text-center py-20 bg-bg-card rounded-3xl border border-border-custom">
              <p className="text-text-sub text-lg">
                条件に一致する大学が見つかりませんでした。
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-border-custom text-center text-text-muted text-sm">
        <p>© 2025 GO院 — 日本大学院受験サポート</p>
      </footer>
    </div>
  );
}
