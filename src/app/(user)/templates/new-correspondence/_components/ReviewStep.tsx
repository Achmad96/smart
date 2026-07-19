import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { getCategoryColor } from "@/lib/utils";
import type { TemplateField } from "@/types";
import type { TemplateOption } from "./types";
import PDFOverlayPreview from "@/components/ui/PDFOverlayPreview";
import type { PDFOverlayField } from "@/lib/pdf-overlay";
import DocxViewerUrl from "@/components/ui/DocxViewerUrl";

interface ReviewStepProps {
  selectedTemplate: TemplateOption | null;
  title: string;
  fieldValues: Record<string, string>;
  categories: any[];
  formattedFieldValues: Record<string, string>;
  renderedPreview: string;
  uploadedFileName: string | null;
  error: string | null;
  isLoading: boolean;
  onBack: () => void;
  onSubmit: (asDraft: boolean) => void;
}

export default function ReviewStep({
  selectedTemplate,
  title,
  fieldValues,
  categories,
  formattedFieldValues,
  renderedPreview,
  uploadedFileName,
  error,
  isLoading,
  onBack,
  onSubmit
}: ReviewStepProps) {
  if (!selectedTemplate) return null;

  const fields = Array.from(new Map((selectedTemplate.fields as unknown as TemplateField[]).map((f) => [f.name, f])).values());
  const getCat = (val: string) => categories.find((c) => c.value === val);

  return (
    <div className="animate-fade-up max-w-3xl mx-auto">
      <Card glass>
        <h3 className="text-lg font-semibold text-slate-900 mb-1">Tinjau Surat Anda</h3>
        <p className="text-sm text-slate-500 mb-6">Harap tinjau semuanya sebelum menyimpan surat.</p>

        {/* Summary */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between py-2 border-b border-slate-200">
            <span className="text-xs text-slate-500">Judul</span>
            <span className="text-sm text-slate-900 font-medium">{title}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-200">
            <span className="text-xs text-slate-500">Template</span>
            <Badge className={getCat(selectedTemplate.category)?.color || getCategoryColor(selectedTemplate.category)}>
              {getCat(selectedTemplate.category)?.label || selectedTemplate.name}
            </Badge>
          </div>
          {uploadedFileName && (
            <div className="flex items-center justify-between py-2 border-b border-slate-200">
              <span className="text-xs text-slate-500">File Terlampir</span>
              <span className="text-sm text-emerald-400">{uploadedFileName}</span>
            </div>
          )}
          <div className="flex items-center justify-between py-2 border-b border-slate-200">
            <span className="text-xs text-slate-500">Kolom Terisi</span>
            <span className="text-sm text-slate-600">
              {Object.values(fieldValues).filter((v) => v.trim()).length} / {fields.length}
            </span>
          </div>
        </div>

        {/* Preview */}
        {selectedTemplate?.content === "PDF_OVERLAY" ? (
          <div className="bg-white rounded-xl mx-auto overflow-hidden shadow-inner border border-slate-200 mb-6 max-w-4xl" style={{ height: "600px" }}>
            <PDFOverlayPreview fileUrl={selectedTemplate.headerImageUrl || ""} fields={selectedTemplate.fields as unknown as PDFOverlayField[]} fieldValues={formattedFieldValues} />
          </div>
        ) : selectedTemplate?.content === "DOCX_OVERLAY" ? (
          <div className="bg-white rounded-xl mx-auto shadow-inner border border-slate-800 mb-6 max-w-4xl" style={{ height: "600px" }}>
            <DocxViewerUrl url={selectedTemplate.headerImageUrl || ""} fields={selectedTemplate.fields as any} fieldValues={formattedFieldValues} />
          </div>
        ) : (
          <div className="bg-white rounded-xl mx-auto shadow-lg border border-slate-200 mb-6 h-150 overflow-auto max-w-4xl">
            <div style={{ width: "max-content", minWidth: "210mm", minHeight: "270mm", padding: "20mm" }}>
              {selectedTemplate?.headerImageUrl && (
                <div className="mb-6 flex justify-center">
                  <img src={selectedTemplate.headerImageUrl} alt="Letterhead" className="max-h-24 object-contain" />
                </div>
              )}
              {renderedPreview.includes("<p>") || renderedPreview.includes("<table>") ? (
                <div className="text-sm text-gray-900 font-serif leading-relaxed" dangerouslySetInnerHTML={{ __html: renderedPreview }} />
              ) : (
                <pre className="text-sm text-gray-900 whitespace-pre-wrap font-serif leading-relaxed">{renderedPreview}</pre>
              )}
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-rose-400 mb-4 flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="ghost" onClick={onBack} className="sm:mr-auto">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Edit Kolom
          </Button>
          <Button onClick={() => onSubmit(false)} isLoading={isLoading}>
            Simpan surat
          </Button>
        </div>
      </Card>
    </div>
  );
}
