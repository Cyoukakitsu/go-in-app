// features/calendar/components/AddScheduleModal.tsx
"use client";

import { useState } from "react";
import { X, Search, Loader2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { createBrowserClient } from "@/shared/lib/supabase/browser";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "@/shared/hooks/use-debounce";
import { PdfUploadTab } from "@/features/calendar/components/PdfUploadTab";

interface AddScheduleModalProps {
  onClose: () => void;
  onAdded: () => void;
}

type Tab = "search" | "manual" | "pdf";

interface UniversityResult {
  id: string;
  name_ja: string;
  name_zh: string;
  type: string;
  departments: string[];
}

interface ScheduleResult {
  id: string;
  department: string;
  application_start: string | null;
  application_end: string | null;
  exam_date: string | null;
  interview_date: string | null;
  result_date: string | null;
}

export function AddScheduleModal({ onClose, onAdded }: AddScheduleModalProps) {
  const [tab, setTab] = useState<Tab>("search");
  const queryClient = useQueryClient();

  // 検索タブ用のstate
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [selectedUniversity, setSelectedUniversity] =
    useState<UniversityResult | null>(null);

  // 手動入力タブ用のstate
  const [manual, setManual] = useState({
    university_name: "",
    university_name_zh: "",
    university_type: "私立",
    department: "",
    application_start: "",
    application_end: "",
    exam_date: "",
    interview_date: "",
    result_date: "",
  });

  // 大学検索クエリ
  const { data: searchResults = [], isLoading: searching } = useQuery({
    queryKey: ["universities", debouncedSearchQuery],
    queryFn: async () => {
      if (debouncedSearchQuery.length < 1) return [];
      const supabase = createBrowserClient();
      const { data } = await supabase
        .from("universities")
        .select("id, name_ja, name_zh, type, departments")
        .or(
          `name_ja.ilike.%${debouncedSearchQuery}%,name_zh.ilike.%${debouncedSearchQuery}%`,
        )
        .limit(8);
      return (data ?? []).map((u) => ({
        ...u,
        departments: Array.isArray(u.departments) ? u.departments : [],
      }));
    },
    enabled: debouncedSearchQuery.length >= 1 && !selectedUniversity,
  });

  // 選択された大学の日程クエリ
  const { data: schedules = [], isLoading: loadingSchedules } = useQuery({
    queryKey: ["university-schedules", selectedUniversity?.id],
    queryFn: async () => {
      if (!selectedUniversity) return [];
      const supabase = createBrowserClient();
      const { data } = await supabase
        .from("university_schedules")
        .select(
          "id, department, application_start, application_end, exam_date, interview_date, result_date",
        )
        .eq("university_id", selectedUniversity.id);
      return data ?? [];
    },
    enabled: !!selectedUniversity,
  });

  // スケジュール追加ミューテーション
  const addScheduleMutation = useMutation({
    mutationFn: async (payload: {
      university_schedule_id?: string;
      university_name: string;
      university_name_zh?: string | null;
      university_type: string;
      department?: string | null;
      application_start?: string | null;
      application_end?: string | null;
      exam_date?: string | null;
      interview_date?: string | null;
      result_date?: string | null;
    }) => {
      const supabase = createBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthorized");

      const { error } = await supabase.from("user_schedules").insert({
        user_id: user.id,
        ...payload,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-schedules"] });
      onAdded();
    },
  });

  const handleSelectUniversity = (uni: UniversityResult) => {
    setSelectedUniversity(uni);
    setSearchQuery(uni.name_ja);
  };

  const handleAddFromSearch = (schedule: ScheduleResult) => {
    if (!selectedUniversity) return;
    addScheduleMutation.mutate({
      university_schedule_id: schedule.id,
      university_name: selectedUniversity.name_ja,
      university_name_zh: selectedUniversity.name_zh,
      university_type: selectedUniversity.type,
      department: schedule.department,
      application_start: schedule.application_start,
      application_end: schedule.application_end,
      exam_date: schedule.exam_date,
      interview_date: schedule.interview_date,
      result_date: schedule.result_date,
    });
  };

  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manual.university_name) return;
    addScheduleMutation.mutate({
      university_name: manual.university_name,
      university_name_zh: manual.university_name_zh || null,
      university_type: manual.university_type,
      department: manual.department || null,
      application_start: manual.application_start || null,
      application_end: manual.application_end || null,
      exam_date: manual.exam_date || null,
      interview_date: manual.interview_date || null,
      result_date: manual.result_date || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* オーバーレイ */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* モーダル本体 */}
      <div className="relative bg-bg-card border border-border-custom rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-border-custom">
          <h2 className="text-xl font-serif text-text-main">学校を追加</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-text-muted hover:bg-primary/5 hover:text-primary transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* タブ切替 */}
        <div className="flex border-b border-border-custom">
          <button
            onClick={() => setTab("search")}
            className={`flex-1 py-3 text-xs font-bold transition-all ${
              tab === "search"
                ? "text-primary border-b-2 border-primary"
                : "text-text-sub hover:text-text-main"
            }`}
          >
            データベースから検索
          </button>
          <button
            onClick={() => setTab("manual")}
            className={`flex-1 py-3 text-xs font-bold transition-all ${
              tab === "manual"
                ? "text-primary border-b-2 border-primary"
                : "text-text-sub hover:text-text-main"
            }`}
          >
            手動で入力
          </button>
          <button
            onClick={() => setTab("pdf")}
            className={`flex-1 py-3 text-xs font-bold transition-all ${
              tab === "pdf"
                ? "text-primary border-b-2 border-primary"
                : "text-text-sub hover:text-text-main"
            }`}
          >
            PDFから読み取る
          </button>
        </div>

        <div className="p-6">
          {/* 検索タブ */}
          {tab === "search" && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <Input
                  placeholder="大学名を入力..."
                  className="pl-10 border-primary/15 rounded-xl h-11"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted animate-spin" />
                )}
              </div>

              {/* 検索候補 */}
              {!selectedUniversity && searchResults.length > 0 && (
                <div className="border border-border-custom rounded-xl overflow-hidden">
                  {searchResults.map((uni) => (
                    <button
                      key={uni.id}
                      onClick={() => handleSelectUniversity(uni)}
                      className="w-full text-left px-4 py-3 hover:bg-bg-hover transition-colors border-b border-border-custom last:border-b-0"
                    >
                      <p className="text-sm font-semibold text-text-main">
                        {uni.name_ja}
                      </p>
                      <p className="text-xs text-text-sub">
                        {uni.name_zh} ·{" "}
                        {uni.type === "国立" || uni.type === "公立"
                          ? "国公立"
                          : uni.type}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {/* 選択された大学の日程一覧 */}
              {selectedUniversity && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-text-main">
                      {selectedUniversity.name_ja} の日程
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-primary h-7 px-2"
                      onClick={() => {
                        setSelectedUniversity(null);
                        setSearchQuery("");
                      }}
                    >
                      再検索
                    </Button>
                  </div>

                  {loadingSchedules ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : schedules.length > 0 ? (
                    <div className="space-y-2">
                      {schedules.map((s) => (
                        <div
                          key={s.id}
                          className="bg-primary/5 border border-primary/10 rounded-xl p-3 space-y-1"
                        >
                          <p className="text-sm font-bold text-text-main">
                            {s.department}
                          </p>
                          {s.exam_date && (
                            <p className="text-xs text-text-sub">
                              試験日: {s.exam_date}
                            </p>
                          )}
                          {s.application_end && (
                            <p className="text-xs text-text-sub">
                              出願締切: {s.application_end}
                            </p>
                          )}
                          <Button
                            onClick={() => handleAddFromSearch(s)}
                            disabled={addScheduleMutation.isPending}
                            className="mt-2 w-full bg-primary text-white rounded-xl h-9 text-sm font-bold hover:opacity-90"
                          >
                            {addScheduleMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              "追加する"
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-text-muted text-center py-4">
                      この大学の日程データはまだ登録されていません。
                      <br />
                      「手動で入力」タブから追加してください。
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* PDFアップロードタブ */}
          {tab === "pdf" && (
            <PdfUploadTab onAdded={onAdded} />
          )}

          {/* 手動入力タブ */}
          {tab === "manual" && (
            <form onSubmit={handleAddManual} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-text-main font-bold text-sm">
                  学校名 <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="例：東京大学"
                  className="border-primary/15 rounded-xl h-11"
                  value={manual.university_name}
                  onChange={(e) =>
                    setManual({ ...manual, university_name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-text-main font-bold text-sm">
                  学校名（中国語）
                </Label>
                <Input
                  placeholder="例：东京大学"
                  className="border-primary/15 rounded-xl h-11"
                  value={manual.university_name_zh}
                  onChange={(e) =>
                    setManual({ ...manual, university_name_zh: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label className="text-text-main font-bold text-sm">種別</Label>
                <div className="flex gap-2">
                  {(["国公立", "私立"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() =>
                        setManual({ ...manual, university_type: t })
                      }
                      className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                        manual.university_type === t
                          ? "bg-primary text-white"
                          : "bg-primary/5 text-primary hover:bg-primary/10"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-text-main font-bold text-sm">
                  研究科
                </Label>
                <Input
                  placeholder="例：工学系研究科"
                  className="border-primary/15 rounded-xl h-11"
                  value={manual.department}
                  onChange={(e) =>
                    setManual({ ...manual, department: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-text-main font-bold text-sm">
                    出願開始日
                  </Label>
                  <Input
                    type="date"
                    className="border-primary/15 rounded-xl h-11"
                    value={manual.application_start}
                    onChange={(e) =>
                      setManual({
                        ...manual,
                        application_start: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-text-main font-bold text-sm">
                    出願締切日
                  </Label>
                  <Input
                    type="date"
                    className="border-primary/15 rounded-xl h-11"
                    value={manual.application_end}
                    onChange={(e) =>
                      setManual({ ...manual, application_end: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-text-main font-bold text-sm">
                    試験日
                  </Label>
                  <Input
                    type="date"
                    className="border-primary/15 rounded-xl h-11"
                    value={manual.exam_date}
                    onChange={(e) =>
                      setManual({ ...manual, exam_date: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-text-main font-bold text-sm">
                    面接日
                  </Label>
                  <Input
                    type="date"
                    className="border-primary/15 rounded-xl h-11"
                    value={manual.interview_date}
                    onChange={(e) =>
                      setManual({ ...manual, interview_date: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-text-main font-bold text-sm">
                  合格発表日
                </Label>
                <Input
                  type="date"
                  className="border-primary/15 rounded-xl h-11"
                  value={manual.result_date}
                  onChange={(e) =>
                    setManual({ ...manual, result_date: e.target.value })
                  }
                />
              </div>

              <Button
                type="submit"
                disabled={
                  addScheduleMutation.isPending || !manual.university_name
                }
                className="w-full bg-primary text-white rounded-xl h-12 font-bold hover:opacity-90 shadow-md mt-2"
              >
                {addScheduleMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "追加する"
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
