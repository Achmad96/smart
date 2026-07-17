import { getTemplates } from "@/actions/template.actions";
import { getCategories } from "@/actions/category.actions";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Link from "next/link";
import { getCategoryColor } from "@/lib/utils";
import { CATEGORIES } from "@/lib/constants";
import type { TemplateField } from "@/types";
import TemplateFilter from "./TemplateFilter";
import SearchInput from "@/components/ui/SearchInput";
import Pagination from "@/components/ui/Pagination";

export const dynamic = "force-dynamic";

export default async function TemplatesPage({ searchParams }: { searchParams: Promise<{ category?: string; page?: string; search?: string }> }) {
  const { category, page, search } = await searchParams;
  const result = await getTemplates(category, { page: Number(page) || 1, search });
  const templates = result.data;
  const categories = await getCategories();
  
  const getCat = (val: string) => categories.find(c => c.value === val);

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <TemplateFilter currentCategory={category || "all"} categories={categories} />
        <SearchInput placeholder="Cari template..." />
      </div>

      {templates.length === 0 ? (
        <Card glass>
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-500">Tidak ada template ditemukan</p>
            <p className="text-xs text-slate-600 mt-1">Coba pilih kategori yang berbeda</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {templates.map((template) => {
            const fields = template.fields as unknown as TemplateField[];
            return (
              <Link key={template.id} href={`/templates/new-correspondence?templateId=${template.id}`} className="group">
                <Card hover glass className="h-full flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center group-hover:bg-primary-500/20 transition-colors">
                      <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                      </svg>
                    </div>
                    <Badge className={getCat(template.category)?.color || getCategoryColor(template.category)}>
                      {getCat(template.category)?.label || template.category}
                    </Badge>
                  </div>

                  <h3 className="text-base font-semibold text-slate-900 group-hover:text-primary-300 transition-colors">{template.name}</h3>
                  <p className="text-sm text-slate-500 mt-2 line-clamp-3 flex-1">{template.description}</p>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5 text-xs text-slate-500">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        {fields?.length || 0} kolom
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-400 group-hover:text-primary-300 group-hover:translate-x-0.5 transition-all">
                      Gunakan template
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {result.totalPages > 1 && (
        <Pagination totalPages={result.totalPages} />
      )}
    </div>
  );
}
