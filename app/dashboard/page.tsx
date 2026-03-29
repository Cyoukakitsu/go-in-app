import { SchoolCard } from "@/components/SchoolCard";
import { SearchFilters } from "@/components/SearchFilters";
import { School } from "lucide-react";
import { Suspense } from "react";

// Mock data for initial development
const MOCK_UNIVERSITIES = [
  {
    id: "1",
    name_ja: "東京大学",
    name_zh: "东京大学",
    type: "国立",
    schedules: [
      {
        id: "s1",
        department: "工学系研究科",
        application_start: "2024-07-01",
        application_end: "2024-07-10",
        exam_date: "2024-08-25",
        result_date: "2024-09-10",
        tags: ["工学", "理系"],
      },
      {
        id: "s2",
        department: "経済学研究科",
        application_start: "2024-06-15",
        application_end: "2024-06-25",
        exam_date: "2024-08-15",
        result_date: "2024-09-05",
        tags: ["経済", "文系"],
      },
    ],
  },
  {
    id: "2",
    name_ja: "早稲田大学",
    name_zh: "早稻田大学",
    type: "私立",
    schedules: [
      {
        id: "s3",
        department: "商学研究科",
        application_start: "2024-08-01",
        application_end: "2024-08-10",
        exam_date: "2024-09-15",
        result_date: "2024-09-30",
        tags: ["商学", "MBA"],
      },
    ],
  },
  {
    id: "3",
    name_ja: "京都大学",
    name_zh: "京都大学",
    type: "国立",
    schedules: [
      {
        id: "s4",
        department: "経済学研究科",
        application_start: "2024-07-05",
        application_end: "2024-07-15",
        exam_date: "2024-08-20",
        result_date: "2024-09-08",
        tags: ["経済", "文系"],
      },
    ],
  },
  {
    id: "4",
    name_ja: "慶應義塾大学",
    name_zh: "庆应义塾大学",
    type: "私立",
    schedules: [
      {
        id: "s5",
        department: "経済学研究科",
        application_start: "2024-07-20",
        application_end: "2024-07-30",
        exam_date: "2024-09-05",
        result_date: "2024-09-20",
        tags: ["経済", "文系"],
      },
    ],
  },
];

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function DashboardPage(props: {
  searchParams: SearchParams;
}) {
  const searchParams = await props.searchParams;
  const query = ((searchParams.q as string) || "").toLowerCase();
  const type = (searchParams.type as string) || "all";

  const filteredUniversities = MOCK_UNIVERSITIES.filter((uni) => {
    const matchesQuery =
      !query ||
      uni.name_ja.toLowerCase().includes(query) ||
      uni.name_zh.toLowerCase().includes(query) ||
      uni.schedules.some((s) => s.department.toLowerCase().includes(query));

    const matchesType =
      type === "all" ||
      (type === "public" && (uni.type === "国立" || uni.type === "公立")) ||
      (type === "private" && uni.type === "私立");

    return matchesQuery && matchesType;
  });

  return (
    <div className="min-h-screen bg-bg-main">
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
          {filteredUniversities.length > 0 ? (
            filteredUniversities.map((university) => (
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
        <p>© 2024 GO院 — 日本大学院受験サポート</p>
      </footer>
    </div>
  );
}
