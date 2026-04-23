"use client";

import { useState, useRef, DragEvent } from "react";
import { Upload, Loader2, FileText, AlertCircle, BookOpen, ChevronLeft } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { createBrowserClient } from "@/shared/lib/supabase/browser";
import { useQueryClient } from "@tanstack/react-query";
import {
  analyzeScheduleText,
  ParsedPdfData,
  ParsedScheduleEntry,
  ExamSession,
} from "@/app/actions/parsePdf";

// pdfjs-dist でブラウザ側テキスト抽出（Vercel サーバーレスの制約を回避）
async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pageTexts: string[] = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((item: any) => ("str" in item ? (item.str as string) : ""))
      .join(" ");
    pageTexts.push(pageText);
  }
  await pdf.destroy();
  return pageTexts.join("\n");
}

interface PdfUploadTabProps {
  onAdded: () => void;
}

type UiState = "idle" | "parsing" | "selecting" | "selecting_session" | "preview" | "error";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function PdfUploadTab({ onAdded }: PdfUploadTabProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uiState, setUiState] = useState<UiState>("idle");
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parsedPdfData, setParsedPdfData] = useState<ParsedPdfData | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<ParsedScheduleEntry | null>(null);

  const [form, setForm] = useState<{
    university_name: string;
    university_type: string;
    department: string;
    application_start: string;
    application_end: string;
    exam_date: string;
    interview_date: string;
    result_date: string;
    notes: string;
  }>({
    university_name: "",
    university_type: "私立",
    department: "",
    application_start: "",
    application_end: "",
    exam_date: "",
    interview_date: "",
    result_date: "",
    notes: "",
  });

  const applySession = (session: ExamSession, entry: ParsedScheduleEntry, base: ParsedPdfData) => {
    const dept = [entry.department, entry.specialization].filter(Boolean).join(" / ");
    setForm({
      university_name: base.university_name ?? "",
      university_type: base.university_type ?? "私立",
      department: dept,
      application_start: session.application_start ?? "",
      application_end: session.application_end ?? "",
      exam_date: session.exam_date ?? "",
      interview_date: session.interview_date ?? "",
      result_date: session.result_date ?? "",
      notes: "",
    });
  };

  const processFile = async (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage("ファイルサイズが10MBを超えています");
      setUiState("error");
      return;
    }

    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      setErrorMessage("PDFファイルを選択してください");
      setUiState("error");
      return;
    }

    setUiState("parsing");

    try {
      // ブラウザ側でテキスト抽出（pdf-parse のサーバー依存を排除）
      const text = await extractPdfText(file);

      if (!text || text.trim().length === 0) {
        setErrorMessage("PDFのテキストを読み取れませんでした（画像PDFの可能性があります）");
        setUiState("error");
        return;
      }

      const result = await analyzeScheduleText(text);

      if (result.success) {
        setParsedPdfData(result.data);
        if (result.data.schedules.length === 1) {
          handleSelectEntryDirect(result.data.schedules[0], result.data);
        } else {
          setUiState("selecting");
        }
      } else {
        setErrorMessage(result.error);
        setUiState("error");
      }
    } catch {
      setErrorMessage("通信エラーが発生しました。もう一度お試しください");
      setUiState("error");
    }
  };

  // processFile内でparsedPdfDataがまだセットされていないため、直接引数で渡す版
  const handleSelectEntryDirect = (entry: ParsedScheduleEntry, base: ParsedPdfData) => {
    if (entry.sessions.length === 1) {
      applySession(entry.sessions[0], entry, base);
      setUiState("preview");
    } else {
      setSelectedEntry(entry);
      setUiState("selecting_session");
    }
  };

  const handleClick = () => fileInputRef.current?.click();

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void processFile(file);
    e.target.value = "";
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void processFile(file);
  };

  const handleRetry = () => {
    setUiState("idle");
    setErrorMessage("");
    setParsedPdfData(null);
    setSelectedEntry(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.university_name || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const supabase = createBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthorized");

      const { error } = await supabase.from("user_schedules").insert({
        user_id: user.id,
        university_name: form.university_name,
        university_type: form.university_type,
        department: form.department || null,
        application_start: form.application_start || null,
        application_end: form.application_end || null,
        exam_date: form.exam_date || null,
        interview_date: form.interview_date || null,
        result_date: form.result_date || null,
        notes: form.notes || null,
      });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["user-schedules"] });
      onAdded();
    } catch (err) {
      console.error("[PdfUploadTab] 保存エラー:", err);
      setErrorMessage("保存に失敗しました。もう一度お試しください");
      setUiState("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ① idle
  if (uiState === "idle") {
    return (
      <div className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={handleFileInputChange}
        />
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer
            transition-all duration-200 select-none
            ${isDragging
              ? "border-[#C4956A] bg-[rgba(196,149,106,0.08)]"
              : "border-[rgba(111,78,55,0.3)] hover:border-[#C4956A] hover:bg-[rgba(196,149,106,0.04)]"
            }
          `}
        >
          <Upload className="w-10 h-10 text-[#C4956A] mx-auto mb-3" />
          <p className="text-sm font-bold text-text-main mb-1">PDFをここにドロップ</p>
          <p className="text-xs text-text-muted">またはクリックしてファイルを選択</p>
          <p className="text-xs text-text-muted mt-2">最大10MB・テキストベースPDFのみ</p>
        </div>
      </div>
    );
  }

  // ② parsing
  if (uiState === "parsing") {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#6F4E37]" />
        <p className="text-sm font-bold text-text-main">募集要項を解析中...</p>
        <p className="text-xs text-text-muted">AIが日程情報を読み取っています</p>
      </div>
    );
  }

  // ③ selecting: 研究科・専攻の選択
  if (uiState === "selecting" && parsedPdfData) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 p-3 bg-[rgba(196,149,106,0.1)] rounded-xl">
          <BookOpen className="w-4 h-4 text-[#C4956A] shrink-0" />
          <p className="text-xs text-text-sub">
            {parsedPdfData.schedules.length}件の研究科が検出されました。追加する研究科を選択してください。
          </p>
        </div>
        <div className="space-y-2">
          {parsedPdfData.schedules.map((entry, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelectEntryDirect(entry, parsedPdfData)}
              className="w-full text-left px-4 py-3 rounded-xl border border-[rgba(111,78,55,0.15)]
                bg-bg-card hover:border-[#C4956A] hover:bg-[rgba(196,149,106,0.06)]
                hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
            >
              <p className="text-sm font-bold text-text-main">
                {entry.department ?? "研究科不明"}
              </p>
              {entry.specialization && (
                <p className="text-xs text-text-sub mt-0.5">{entry.specialization}</p>
              )}
              {entry.sessions.length > 1 && (
                <p className="text-xs text-text-muted mt-1">試験 {entry.sessions.length}回</p>
              )}
            </button>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleRetry}
          className="w-full h-12 border-[1.5px] border-[#6F4E37] text-[#6F4E37] rounded-xl hover:bg-[#6F4E37] hover:text-white transition-all"
        >
          やり直す
        </Button>
      </div>
    );
  }

  // ④ selecting_session: 試験回の選択
  if (uiState === "selecting_session" && selectedEntry && parsedPdfData) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setUiState(parsedPdfData.schedules.length > 1 ? "selecting" : "idle")}
          className="flex items-center gap-1 text-xs text-text-sub hover:text-primary transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          戻る
        </button>

        <div className="flex items-center gap-2 p-3 bg-[rgba(196,149,106,0.1)] rounded-xl">
          <BookOpen className="w-4 h-4 text-[#C4956A] shrink-0" />
          <div>
            <p className="text-xs font-bold text-text-main">
              {[selectedEntry.department, selectedEntry.specialization].filter(Boolean).join(" / ")}
            </p>
            <p className="text-xs text-text-sub mt-0.5">受験する試験を選択してください</p>
          </div>
        </div>

        <div className="space-y-2">
          {selectedEntry.sessions.map((session, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                applySession(session, selectedEntry, parsedPdfData);
                setUiState("preview");
              }}
              className="w-full text-left px-4 py-3 rounded-xl border border-[rgba(111,78,55,0.15)]
                bg-bg-card hover:border-[#C4956A] hover:bg-[rgba(196,149,106,0.06)]
                hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
            >
              <p className="text-sm font-bold text-text-main">
                {i === 0 ? "夏季入試" : i === 1 ? "冬季入試" : `第${i + 1}次試験`}
              </p>
            </button>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleRetry}
          className="w-full h-12 border-[1.5px] border-[#6F4E37] text-[#6F4E37] rounded-xl hover:bg-[#6F4E37] hover:text-white transition-all"
        >
          やり直す
        </Button>
      </div>
    );
  }

  // ⑤ error
  if (uiState === "error") {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center justify-center py-10 space-y-3">
          <AlertCircle className="w-10 h-10 text-destructive" />
          <p className="text-sm font-bold text-text-main">解析に失敗しました</p>
          <p className="text-xs text-text-muted text-center">{errorMessage}</p>
        </div>
        <Button
          onClick={handleRetry}
          variant="outline"
          className="w-full border-[1.5px] border-[#6F4E37] text-[#6F4E37] rounded-xl hover:bg-[#6F4E37] hover:text-white transition-all"
        >
          別のPDFを試す
        </Button>
      </div>
    );
  }

  // ⑥ preview: 解析結果フォーム
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2 p-3 bg-[rgba(196,149,106,0.1)] rounded-xl">
        <FileText className="w-4 h-4 text-[#C4956A] shrink-0" />
        <p className="text-xs text-text-sub">
          AIが抽出した情報です。内容を確認・修正してから追加してください。
        </p>
      </div>

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
          className="border-primary/15 rounded-xl resize-none min-h-24"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (selectedEntry && selectedEntry.sessions.length > 1) {
              setUiState("selecting_session");
            } else if (parsedPdfData && parsedPdfData.schedules.length > 1) {
              setUiState("selecting");
            } else {
              handleRetry();
            }
          }}
          className="flex-1 h-12 border-[1.5px] border-[#6F4E37] text-[#6F4E37] rounded-xl hover:bg-[#6F4E37] hover:text-white transition-all"
        >
          やり直す
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !form.university_name}
          className="flex-1 bg-primary text-white rounded-xl h-12 font-bold hover:opacity-90 shadow-md"
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "追加する"}
        </Button>
      </div>
    </form>
  );
}
