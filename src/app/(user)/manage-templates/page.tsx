import { getAllTemplates } from "@/actions/template.actions";
import { getCategories } from "@/actions/category.actions";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Link from "next/link";
import { formatDate, getCategoryColor } from "@/lib/utils";
import type { TemplateField } from "@/types";
import DeleteTemplateButton from "@/components/ui/DeleteTemplateButton";
import NewTemplateDropdown from "./NewTemplateDropdown";
import SearchInput from "@/components/ui/SearchInput";
import Pagination from "@/components/ui/Pagination";

export const dynamic = "force-dynamic";

export default async function EditTemplatesPage({ searchParams }: { searchParams: Promise<{ page?: string; search?: string }> }) {
  const { page, search } = await searchParams;
  const result = await getAllTemplates({ page: Number(page) || 1, search });
  const templates = result.data;
  const categories = await getCategories();
  
  const getCat = (val: string) => categories.find(c => c.value === val);

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <p className="text-sm text-slate-500">{result.total} total template</p>
          <SearchInput placeholder="Cari template..." />
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/manage-templates/categories" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-all border border-slate-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Kelola Kategori
          </Link>
          <NewTemplateDropdown />
        </div>
      </div>

      <div className="space-y-3 stagger-children">
        {templates.map((template) => {
          const fields = template.fields as unknown as TemplateField[];
          return (
            <Link key={template.id} href={`/manage-templates/${template.id}`} className="block group">
              <Card hover glass className="flex items-center justify-between">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-primary-500/10 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900 truncate">{template.name}</p>
                      {!template.isActive && <Badge variant="danger">Tidak Aktif</Badge>}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getCat(template.category)?.color || getCategoryColor(template.category)}>
                        {getCat(template.category)?.label || template.category}
                      </Badge>
                      <span className="text-xs text-slate-500">{fields?.length || 0} kolom</span>
                      <span className="text-slate-700">•</span>
                      <span className="text-xs text-slate-500">{template._count.correspondences} kali digunakan</span>
                      <span className="text-slate-700">•</span>
                      <span className="text-xs text-slate-500" suppressHydrationWarning>
                        {formatDate(template.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center">
                    <DeleteTemplateButton id={template.id} />
                  </div>
                  <svg className="w-5 h-5 text-slate-600 group-hover:text-slate-500 group-hover:translate-x-1 transition-all shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
      
      {result.totalPages > 1 && (
        <Pagination totalPages={result.totalPages} />
      )}
    </div>
  );
}
