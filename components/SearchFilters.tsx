"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "@/lib/hooks/use-debounce";

export function SearchFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentQuery = searchParams.get("q") || "";
  const currentType = searchParams.get("type") || "all";

  const [search, setSearch] = useState(currentQuery);
  const debouncedSearch = useDebounce(search, 300);

  const filters = [
    { label: "すべて", value: "all" },
    { label: "国公立", value: "public" },
    { label: "私立", value: "private" },
  ];

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedSearch) {
      params.set("q", debouncedSearch);
    } else {
      params.delete("q");
    }
    router.push(`?${params.toString()}`, { scroll: false });
  }, [debouncedSearch, router, searchParams]);

  const handleFilter = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("type", value);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-8 mb-12">
      <div className="relative max-w-2xl mx-auto group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-accent-custom transition-colors" />
        <Input 
          placeholder="大学名や研究科で検索..." 
          className="pl-12 pr-5 py-7 border-[1.5px] border-primary/15 rounded-2xl bg-bg-card text-text-main focus:border-accent-custom focus:ring-4 focus:ring-accent-custom/10 transition-all text-lg shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex justify-center gap-3 flex-wrap">
        {filters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => handleFilter(filter.value)}
            className={`
              px-8 py-3 rounded-full text-sm font-bold transition-all duration-200
              ${currentType === filter.value 
                ? 'bg-primary text-white shadow-lg -translate-y-0.5' 
                : 'bg-primary/5 text-primary hover:bg-primary/10 hover:-translate-y-0.5'
              }
            `}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  );
}
