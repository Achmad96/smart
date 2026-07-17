"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function TemplateFilter({ currentCategory, categories }: { currentCategory: string; categories: { value: string; label: string }[] }) {
  const router = useRouter();

  const allCategories = [{ value: "all", label: "Semua Template" }, ...categories];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {allCategories.map((cat) => (
        <button
          key={cat.value}
          onClick={() => {
            const params = cat.value === "all" ? "" : `?category=${cat.value}`;
            router.push(`/templates${params}`);
          }}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer whitespace-nowrap flex-shrink-0",
            currentCategory === cat.value ? "bg-primary-600 text-white shadow-lg shadow-primary-500/25" : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 border border-slate-200 hover:border-slate-200"
          )}>
          {cat.label}
        </button>
      ))}
    </div>
  );
}
