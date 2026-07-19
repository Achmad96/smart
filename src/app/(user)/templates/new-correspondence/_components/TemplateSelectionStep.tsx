import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { cn, getCategoryColor } from "@/lib/utils";
import type { TemplateField } from "@/types";
import type { TemplateOption } from "./types";
import { useRouter } from "next/navigation";

interface TemplateSelectionStepProps {
  templates: TemplateOption[];
  categories: any[];
  isLoadingTemplates: boolean;
  selectedTemplate: TemplateOption | null;
  onSelectTemplate: (template: TemplateOption) => void;
}

export default function TemplateSelectionStep({
  templates,
  categories,
  isLoadingTemplates,
  selectedTemplate,
  onSelectTemplate
}: TemplateSelectionStepProps) {
  const router = useRouter();
  
  const getCat = (val: string) => categories.find((c) => c.value === val);

  return (
    <div className="animate-fade-up">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-slate-900">Pilih Template</h3>
        <p className="text-sm text-slate-500 mt-1">Pilih template yang sesuai dengan jenis surat Anda</p>
      </div>

      {isLoadingTemplates ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 rounded-2xl bg-slate-100 border border-slate-200 animate-shimmer" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {templates.map((template) => {
            const tFields = template.fields as unknown as TemplateField[];
            const isSelected = selectedTemplate?.id === template.id;
            return (
              <button
                key={template.id}
                onClick={() => onSelectTemplate(template)}
                className={cn(
                  "text-left rounded-2xl border p-6 transition-all duration-300 cursor-pointer",
                  isSelected ? "border-primary-500/50 bg-primary-500/10" : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50/80"
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
                    </svg>
                  </div>
                  <Badge className={getCat(template.category)?.color || getCategoryColor(template.category)}>
                    {getCat(template.category)?.label || template.category}
                  </Badge>
                </div>
                <h4 className="text-sm font-semibold text-slate-900">{template.name}</h4>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{template.description}</p>
                <p className="text-xs text-slate-600 mt-3">{tFields?.length || 0} kolom untuk diisi</p>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex justify-between mt-6">
        <Button variant="ghost" onClick={() => router.push("/correspondence")}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Kembali
        </Button>
      </div>
    </div>
  );
}
