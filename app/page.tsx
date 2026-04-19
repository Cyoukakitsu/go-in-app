import Link from "next/link";
import {
  Calendar,
  AlertTriangle,
  FileText,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import { ThemeToggle } from "@/shared/components/ThemeToggle";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background font-sans">
      {/* ===== Landing Navbar ===== */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between relative">
          <Link
            href="/"
            className="font-serif text-xl font-bold text-primary tracking-tight"
          >
            GO院
          </Link>
          <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <a
              href="#features"
              className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
            >
              機能
            </a>
            <a
              href="#about"
              className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
            >
              運営者について
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/auth/login"
              className="text-sm font-medium text-primary hover:text-foreground transition-colors px-3 py-1.5"
            >
              Login
            </Link>
            <Link
              href="/auth/signup"
              className="text-sm font-semibold bg-primary text-primary-foreground rounded-xl px-4 py-2 hover:opacity-90 transition-opacity"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* ===== Hero Section ===== */}
      <section className="pt-32 pb-20 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-150 h-150 rounded-full bg-accent/8 blur-3xl" />
        </div>

        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary/8 text-primary rounded-full px-4 py-1.5 text-xs font-semibold mb-8 tracking-wide">
            日本大学院受験サポート
          </div>

          <h1 className="font-serif text-5xl md:text-6xl font-bold text-foreground leading-tight mb-6">
            夢の大学院への
            <br />
            最短ルートを、ともに。
          </h1>

          <p className="text-muted-foreground text-base leading-relaxed mb-10 max-w-xl mx-auto">
            出願時期・試験情報・合格情報をまとめて管理。
            <br className="hidden md:block" />
            スケジュールの重複を防ぎ、万全の受験対策を。
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/auth/signup"
              className="flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-6 py-3 text-sm font-semibold hover:opacity-90 transition-all shadow-md hover:shadow-lg"
            >
              無料アカウントを作成
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#features"
              className="flex items-center gap-2 border border-primary/25 text-primary rounded-xl px-6 py-3 text-sm font-semibold hover:bg-primary/5 transition-all"
            >
              機能で知る
            </a>
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-accent animate-bounce">
          <ChevronDown className="w-5 h-5" />
        </div>
      </section>

      {/* ===== Features Section ===== */}
      <section id="features" className="py-24 px-6 bg-card">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-3">
              GO院でできること
            </h2>
            <p className="text-muted-foreground text-sm">
              受験に必要なすべてが、ここに。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-background border border-border rounded-2xl p-7 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 group">
              <div className="w-11 h-11 rounded-xl bg-primary/8 flex items-center justify-center mb-5 group-hover:bg-primary/12 transition-colors">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground text-base mb-2">
                日程を一元管理
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                出願期間・試験日・合格発表・入学手続きなど、複数校のスケジュールをひとつのインターフェースで全体把握できます。
              </p>
            </div>

            <div className="bg-background border border-border rounded-2xl p-7 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 group">
              <div className="w-11 h-11 rounded-xl bg-accent/12 flex items-center justify-center mb-5 group-hover:bg-accent/18 transition-colors">
                <AlertTriangle className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-semibold text-foreground text-base mb-2">
                重複を自動検出!
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                試験日が被っている大学院のリストを自動で表示。見落としがちな日程の重複を、スケジュール登録の瞬間に検知します。
              </p>
            </div>

            <div className="bg-background border border-border rounded-2xl p-7 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 group">
              <div className="w-11 h-11 rounded-xl bg-primary/8 flex items-center justify-center mb-5 group-hover:bg-primary/12 transition-colors">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground text-base mb-2">
                PDFから自動読み取り
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                募集要項のPDFをアップロードするだけで、日程データを自動抽出。大学院ごとのデータを管理します。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Steps Section ===== */}
      <section className="py-24 px-6 bg-background">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
              使い方はかんたん3ステップ
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="text-center">
              <div className="text-6xl font-bold text-primary/12 mb-4 font-serif leading-none">
                01
              </div>
              <h3 className="font-semibold text-foreground text-base mb-2">
                学校を検索
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                データベースから志望校を検索。学校名・研究科名・PDF募集要項から日程を入力します。
              </p>
            </div>

            <div className="text-center">
              <div className="text-6xl font-bold text-primary/12 mb-4 font-serif leading-none">
                02
              </div>
              <h3 className="font-semibold text-foreground text-base mb-2">
                カレンダーに登録
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                出願・試験・合格発表の日程を、マイカレンダーにワンクリックで登録できます。
              </p>
            </div>

            <div className="text-center">
              <div className="text-6xl font-bold text-primary/12 mb-4 font-serif leading-none">
                03
              </div>
              <h3 className="font-semibold text-foreground text-base mb-2">
                日程を管理・確認
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                タイムライン表示やガントチャートで日程を一目確認。重複があればメールでもお知らせします。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer
        id="about"
        className="bg-background border-t border-border py-12 px-6"
      >
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-10">
            <div>
              <div className="font-serif text-lg font-bold text-primary mb-1">
                GO院
              </div>
              <p className="text-muted-foreground text-xs max-w-55 leading-relaxed">
                在日中国人留学生のための日本大学院受験サポート
              </p>
            </div>
            <nav className="flex flex-wrap gap-6">
              <a
                href="#features"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                機能
              </a>

              <a
                href="#about"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                運営者について
              </a>
            </nav>
          </div>
          <div className="border-t border-border pt-6 text-center text-xs text-muted-foreground">
            © 2026 GO 院. Crushing academia excellence for the great offense.
          </div>
        </div>
      </footer>
    </div>
  );
}
