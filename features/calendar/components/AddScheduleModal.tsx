// features/calendar/components/AddScheduleModal.tsx
"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { createBrowserClient } from "@/shared/lib/supabase/browser";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PdfUploadTab } from "@/features/calendar/components/PdfUploadTab";

interface AddScheduleModalProps {
  onClose: () => void;
  onAdded: () => void;
}

type Tab = "manual" | "pdf";

const STATUS_OPTIONS = [
  { value: "planning",  label: "検討中",   cls: "text-text-muted bg-muted" },
  { value: "applied",   label: "出願完了", cls: "text-primary bg-primary/10" },
  { value: "examined",  label: "受験済",   cls: "text-[#8B5E3C] bg-[rgba(160,110,90,0.12)]" },
  { value: "passed",    label: "合格",     cls: "text-badge-public-text bg-badge-public" },
  { value: "failed",    label: "不合格",   cls: "text-destructive bg-destructive/10" },
] as const;

export function AddScheduleModal({ onClose, onAdded }: AddScheduleModalProps) {
  const [tab, setTab] = useState<Tab>("manual");
  const queryClient = useQueryClient();

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
    status: "planning",
    notes: "",
  });

  const addScheduleMutation = useMutation({
    mutationFn: async (payload: {
      university_name: string;
      university_name_zh?: string | null;
      university_type: string;
      department?: string | null;
      application_start?: string | null;
      application_end?: string | null;
      exam_date?: string | null;
      interview_date?: string | null;
      result_date?: string | null;
      status?: string;
      notes?: string | null;
    }) => {
      const supabase = createBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
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

  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manual.university_name) return;
    addScheduleMutation.mutate({
      university_name: manual.university_name,
      university_name_zh: manual.university_name_zh || null,
      university_type: manual.university_type,
      department: manual.department || null,
      notes: manual.notes || null,
      application_start: manual.application_start || null,
      application_end: manual.application_end || null,
      exam_date: manual.exam_date || null,
      interview_date: manual.interview_date || null,
      result_date: manual.result_date || null,
      status: manual.status,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-bg-card border border-border-custom rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-border-custom shrink-0">
          <h2 className="text-xl font-serif text-text-main">学校を追加</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-text-muted hover:bg-primary/5 hover:text-primary transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* タブ切替 */}
        <div className="flex border-b border-border-custom shrink-0">
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

        <div className="p-6 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {/* PDFアップロードタブ */}
          {tab === "pdf" && <PdfUploadTab onAdded={onAdded} />}

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
                  onChange={(e) => setManual({ ...manual, university_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-text-main font-bold text-sm">種別</Label>
                <div className="flex gap-2">
                  {(["国公立", "私立"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setManual({ ...manual, university_type: t })}
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
                <Label className="text-text-main font-bold text-sm">研究科</Label>
                <Input
                  placeholder="例：工学系研究科"
                  className="border-primary/15 rounded-xl h-11"
                  value={manual.department}
                  onChange={(e) => setManual({ ...manual, department: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-text-main font-bold text-sm">出願開始日</Label>
                  <Input
                    type="date"
                    className="border-primary/15 rounded-xl h-11"
                    value={manual.application_start}
                    onChange={(e) => setManual({ ...manual, application_start: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-text-main font-bold text-sm">出願締切日</Label>
                  <Input
                    type="date"
                    className="border-primary/15 rounded-xl h-11"
                    value={manual.application_end}
                    onChange={(e) => setManual({ ...manual, application_end: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-text-main font-bold text-sm">筆記試験日</Label>
                  <Input
                    type="date"
                    className="border-primary/15 rounded-xl h-11"
                    value={manual.exam_date}
                    onChange={(e) => setManual({ ...manual, exam_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-text-main font-bold text-sm">面接日</Label>
                  <Input
                    type="date"
                    className="border-primary/15 rounded-xl h-11"
                    value={manual.interview_date}
                    onChange={(e) => setManual({ ...manual, interview_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-text-main font-bold text-sm">合格発表日</Label>
                  <Input
                    type="date"
                    className="border-primary/15 rounded-xl h-11"
                    value={manual.result_date}
                    onChange={(e) => setManual({ ...manual, result_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-text-main font-bold text-sm">ステータス</Label>
                  <select
                    value={manual.status}
                    onChange={(e) => setManual({ ...manual, status: e.target.value })}
                    className="w-full h-11 rounded-xl border border-primary/15 bg-bg-card text-text-main text-sm px-3 outline-none focus:border-primary/40 cursor-pointer"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-text-main font-bold text-sm">備考</Label>
                <Textarea
                  placeholder="メモや備考を入力してください"
                  className="border-primary/15 rounded-xl resize-none min-h-[96px]"
                  value={manual.notes}
                  onChange={(e) => setManual({ ...manual, notes: e.target.value })}
                />
              </div>

              <Button
                type="submit"
                disabled={addScheduleMutation.isPending || !manual.university_name}
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
