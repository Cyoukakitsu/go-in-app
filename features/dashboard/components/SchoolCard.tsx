"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Calendar, GraduationCap, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/shared/lib/supabase/browser";

interface Schedule {
  id: string;
  department: string;
  application_start: string;
  application_end: string;
  exam_date: string;
  result_date: string;
  tags: string[];
}

interface University {
  id: string;
  name_ja: string;
  name_zh: string;
  type: string;
  schedules: Schedule[];
}

interface SchoolCardProps {
  university: University;
}

export function SchoolCard({ university }: SchoolCardProps) {
  const router = useRouter();
  const typeColorClass =
    university.type === "国立" ||
    university.type === "公立" ||
    university.type === "国公立"
      ? "bg-badge-public text-badge-public-text"
      : "bg-badge-private text-badge-private-text";

  const handleAddToCalendar = async () => {
    const supabase = createBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    // TODO: 実際のカレンダー追加ロジックをここに実装
    router.push("/calendar");
  };

  return (
    <Card className="bg-bg-card border-border-custom rounded-2xl p-2 hover:bg-bg-hover hover:border-border-hover hover:-translate-y-0.5 hover:shadow-lg transition-all duration-250 overflow-hidden group relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-accent-pale to-accent-custom opacity-0 group-hover:opacity-100 transition-opacity" />

      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <Badge
            className={`${typeColorClass} rounded-xl border-none font-medium`}
          >
            {university.type === "国立" || university.type === "公立"
              ? "国公立"
              : university.type}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary hover:bg-primary/5 rounded-full"
            onClick={handleAddToCalendar}
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
        <div className="mt-3">
          <CardTitle className="text-2xl font-serif text-text-main leading-tight">
            {university.name_ja}
          </CardTitle>
          <p className="text-text-sub text-sm font-medium mt-1">
            {university.name_zh}
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {university.schedules.map((schedule) => (
          <div
            key={schedule.id}
            className="bg-primary/5 rounded-xl p-3 border border-primary/10"
          >
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-text-main">
                {schedule.department}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-text-sub">
                <Calendar className="w-3.5 h-3.5" />
                <span>出願締切:</span>
              </div>
              <div className="text-text-main font-medium">
                {schedule.application_end}
              </div>

              <div className="flex items-center gap-1.5 text-text-sub">
                <Calendar className="w-3.5 h-3.5" />
                <span>試験日:</span>
              </div>
              <div className="text-text-main font-medium">
                {schedule.exam_date}
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-3">
              {schedule.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-primary/5 text-primary rounded-xl px-2.5 py-0.5 text-[10px] font-bold"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}

        <Button
          className="w-full bg-primary text-white rounded-xl py-6 font-bold hover:opacity-90 transition-all shadow-md group-hover:shadow-lg"
          onClick={handleAddToCalendar}
        >
          カレンダーに追加
        </Button>
      </CardContent>
    </Card>
  );
}
