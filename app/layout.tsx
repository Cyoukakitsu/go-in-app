import type { Metadata } from "next";
import { Playfair_Display, DM_Sans, Noto_Sans_JP, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/shared/lib/utils";
import { Navbar } from "@/shared/components/Navbar";
import { Providers } from "@/shared/components/providers";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const notoTranslate = Noto_Sans_JP({
  variable: "--font-noto-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GO院 | 日本大学院志望校管理ツール",
  description: "留学生のための大学院出愿・試験日程管理ツール",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={cn("h-full", "antialiased", playfair.variable, dmSans.variable, notoTranslate.variable, "font-sans", geist.variable)}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans relative bg-background text-foreground transition-colors duration-300">
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
