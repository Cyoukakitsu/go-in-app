// features/calendar/components/EditScheduleModal.tsx
"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { createBrowserClient } from "@/shared/lib/supabase/browser";
import type { UserScheduleRow } from "@/features/calendar/types";

interface EditScheduleModalProps {
  schedule: UserScheduleRow;
  onClose: () => void;
  onUpdated: () => void;
}

export function EditScheduleModal({ schedule, onClose, onUpdated }: EditScheduleModalProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    university_name: schedule.university_name ?? "",
    university_type: schedule.university_type ?? "私立",
    department: schedule.department ?? "",
    application_start: schedule.application_start ?? "",
    application_end: schedule.application_end ?? "",
    exam_date: schedule.exam_date ?? "",
    interview_date: schedule.interview_date ?? "",
    result_date: schedule.result_date ?? "",
    notes: schedule.notes ?? "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.university_name) return;
    setSaving(true);

    const supabase = createBrowserClient();
    const { error } = await supabase
      .from("user_schedules")
      .update({
        university_name: form.university_name,
        university_type: form.university_type,
        department: form.department || null,
        application_start: form.application_start || null,
        application_end: form.application_end || null,
        exam_date: form.exam_date || null,
        interview_date: form.interview_date || null,
        result_date: form.result_date || null,
        notes: form.notes || null,
      })
      .eq("id", schedule.id);

    setSaving(false);
    if (!error) onUpdated();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-bg-card border border-border-custom rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border-custom shrink-0">
          <h2 className="text-xl font-serif text-text-main">日程を編集</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-text-muted hover:bg-primary/5 hover:text-primary transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-text-main font-bold text-sm">
                学校名 <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="例：東京大学"
                className="border-primary/15 rounded-xl h-11"
                value={form.university_name}
                onChange={(e) => setForm({ ...form, university_name: e.target.value })}
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
                    onClick={() => setForm({ ...form, university_type: t })}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                      form.university_type === t
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
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-text-main font-bold text-sm">出願開始日</Label>
                <Input
                  type="date"
                  className="border-primary/15 rounded-xl h-11"
                  value={form.application_start}
                  onChange={(e) => setForm({ ...form, application_start: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-text-main font-bold text-sm">出願締切日</Label>
                <Input
                  type="date"
                  className="border-primary/15 rounded-xl h-11"
                  value={form.application_end}
                  onChange={(e) => setForm({ ...form, application_end: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-text-main font-bold text-sm">筆記試験日</Label>
                <Input
                  type="date"
                  className="border-primary/15 rounded-xl h-11"
                  value={form.exam_date}
                  onChange={(e) => setForm({ ...form, exam_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-text-main font-bold text-sm">面接日</Label>
                <Input
                  type="date"
                  className="border-primary/15 rounded-xl h-11"
                  value={form.interview_date}
                  onChange={(e) => setForm({ ...form, interview_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-text-main font-bold text-sm">合格発表日</Label>
              <Input
                type="date"
                className="border-primary/15 rounded-xl h-11"
                value={form.result_date}
                onChange={(e) => setForm({ ...form, result_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-text-main font-bold text-sm">備考</Label>
              <Textarea
                placeholder="メモや備考を入力してください"
                className="border-primary/15 rounded-xl resize-none min-h-[96px]"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            <Button
              type="submit"
              disabled={saving || !form.university_name}
              className="w-full bg-primary text-white rounded-xl h-12 font-bold hover:opacity-90 shadow-md mt-2"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "保存する"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
