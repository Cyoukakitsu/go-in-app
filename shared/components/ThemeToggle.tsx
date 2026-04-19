"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Palette, Check } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/shared/ui/dropdown-menu";

const themes = [
  { name: "Sepia", value: "sepia", color: "#6F4E37" },
  { name: "Light", value: "light", color: "#FFFFFF" },
  { name: "Dark", value: "dark", color: "#141414" },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <DropdownMenu>
      <MenuPrimitive.Trigger
        className="flex items-center justify-center w-9 h-9 rounded-full text-[#8b7355] hover:bg-[rgba(111,78,55,0.08)] hover:text-[#6f4e37] transition-all relative group cursor-pointer outline-none"
        aria-label="テーマ切り替え"
      >
        <Palette className="w-4 h-4 transition-transform group-hover:scale-110" />
      </MenuPrimitive.Trigger>
      <DropdownMenuContent
        align="end"
        className="w-40 bg-card/95 backdrop-blur-md border-border-custom rounded-2xl shadow-2xl p-2"
      >
        <div className="px-2 py-1.5 text-xs font-bold text-text-muted uppercase tracking-wider">
          テーマ
        </div>
        {themes.map((t) => (
          <DropdownMenuItem
            key={t.value}
            onClick={() => setTheme(t.value)}
            className={cn(
              "flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors mb-1 last:mb-0",
              mounted && theme === t.value
                ? "bg-primary text-white font-bold"
                : "text-text-main hover:bg-primary/10",
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full border border-black/10"
                style={{ backgroundColor: t.color }}
              />
              <span className="text-sm">{t.name}</span>
            </div>
            {mounted && theme === t.value && <Check className="w-4 h-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
