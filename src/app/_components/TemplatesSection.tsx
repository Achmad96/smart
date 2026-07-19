import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { getCategoryColor } from "@/lib/utils";
import type { TemplateField } from "@/types";

interface TemplatesSectionProps {
  templates: {
    id: string;
    name: string;
    description: string | null;
    category: string;
    fields: unknown;
  }[];
}

export default function TemplatesSection({ templates }: TemplatesSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Template Tersedia</h2>
          <p className="text-xs text-slate-500 mt-0.5">Pilih template untuk memulai</p>
        </div>
        <Link href="/templates" className="text-xs font-medium text-primary-400 hover:text-primary-300 transition-colors">
          Lihat semua →
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
        {templates.map((template) => {
          const fields = template.fields as unknown as TemplateField[];
          return (
            <Link key={template.id} href={`/templates/new-correspondence?templateId=${template.id}`} className="group">
              <Card hover glass className="h-full">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center group-hover:bg-primary-500/20 transition-colors">
                    <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
                    </svg>
                  </div>
                  <Badge className={getCategoryColor(template.category)}>{template.category}</Badge>
                </div>
                <h3 className="text-sm font-semibold text-slate-900 group-hover:text-primary-300 transition-colors">{template.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{template.description}</p>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200">
                  <span className="text-xs text-slate-500">{fields?.length || 0} kolom</span>
                  <span className="text-xs text-primary-400 ml-auto group-hover:translate-x-0.5 transition-transform">Gunakan →</span>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
