import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { cn, getCategoryColor } from "@/lib/utils";
import type { TemplateField } from "@/types";
import type { TemplateOption, VerifyMessage } from "./types";
import ListEditor from "@/components/ui/ListEditor";
import TableEditor from "@/components/ui/TableEditor";
import PDFOverlayPreview from "@/components/ui/PDFOverlayPreview";
import type { PDFOverlayField } from "@/lib/pdf-overlay";
import DocxViewerUrl from "@/components/ui/DocxViewerUrl";

interface FormFillingStepProps {
  selectedTemplate: TemplateOption | null;
  title: string;
  setTitle: (val: string) => void;
  nik: string;
  setNik: (val: string) => void;
  fieldValues: Record<string, string>;
  handleFieldChange: (name: string, val: string) => void;
  isVerifyingNik: boolean;
  nikVerifyMessage: VerifyMessage | null;
  handleVerifyNik: () => void;
  categories: any[];
  formattedFieldValues: Record<string, string>;
  renderedPreview: string;
  uploadedFileName: string | null;
  canProceed: () => boolean;
  onBack: () => void;
  onNext: () => void;
}

export default function FormFillingStep({
  selectedTemplate,
  title,
  setTitle,
  nik,
  setNik,
  fieldValues,
  handleFieldChange,
  isVerifyingNik,
  nikVerifyMessage,
  handleVerifyNik,
  categories,
  formattedFieldValues,
  renderedPreview,
  uploadedFileName,
  canProceed,
  onBack,
  onNext
}: FormFillingStepProps) {
  if (!selectedTemplate) return null;

  const fields = Array.from(new Map((selectedTemplate.fields as unknown as TemplateField[]).map((f) => [f.name, f])).values());
  const getCat = (val: string) => categories.find((c) => c.value === val);

  return (
    <div className="animate-fade-up">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="space-y-6">
          <Card glass>
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Judul Dokumen</h3>
            <Input label="Judul Surat" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="mis., Permohonan Anggaran ke Direktur Keuangan" required />
          </Card>

          <Card glass>
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Data Pemohon</h3>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Input label="NIK Pemohon" value={nik} onChange={(e) => setNik(e.target.value)} placeholder="Masukkan 16 digit NIK" required />
              </div>
              <Button type="button" variant="secondary" onClick={handleVerifyNik} disabled={isVerifyingNik || !nik} className="h-10 mb-0.5">
                {isVerifyingNik ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  "Verifikasi"
                )}
              </Button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              * Data NIK terintegrasi dengan database kependudukan desa Sumbermalang.
            </p>
            {nikVerifyMessage && <div className={cn("mt-4 p-3 rounded-lg text-sm border", nikVerifyMessage.type === "success" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20")}>{nikVerifyMessage.text}</div>}
          </Card>

          <Card glass>
            <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
              Isi Kolom Template
              <Badge className={getCat(selectedTemplate.category)?.color || getCategoryColor(selectedTemplate.category)}>{getCat(selectedTemplate.category)?.label || selectedTemplate.name}</Badge>
            </h3>
            <div className="space-y-4">
              {fields.map((field) => {
                return (
                  <div key={field.name} className="relative">
                    {field.type === "list_ordered" || field.type === "list_unordered" ? (
                      <ListEditor label={field.label} value={fieldValues[field.name] || ""} onChange={(val) => handleFieldChange(field.name, val)} placeholder={field.placeholder} />
                    ) : field.type === "table" ? (
                      <TableEditor label={field.label} value={fieldValues[field.name] || ""} onChange={(val) => handleFieldChange(field.name, val)} />
                    ) : field.type === "textarea" ? (
                      <Textarea label={field.label} value={fieldValues[field.name] || ""} onChange={(e) => handleFieldChange(field.name, e.target.value)} placeholder={field.placeholder} required={field.required} />
                    ) : (
                      <div className="flex gap-2 items-end">
                        <div className="flex-1">
                          <Input
                            label={field.label}
                            type={field.type === "date" ? "date" : field.type === "email" ? "email" : field.type === "number" ? "number" : "text"}
                            value={fieldValues[field.name] || ""}
                            onChange={(e) => handleFieldChange(field.name, e.target.value)}
                            placeholder={field.placeholder}
                            required={field.required}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Live Preview */}
        <div className="lg:sticky lg:top-6 self-start">
          <Card glass>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Pratinjau Langsung
              </h3>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest">Pembaruan secara langsung</span>
            </div>

            {selectedTemplate?.content === "PDF_OVERLAY" ? (
              <div className="bg-white rounded-xl overflow-hidden shadow-inner border border-slate-200" style={{ height: "600px" }}>
                <PDFOverlayPreview fileUrl={selectedTemplate.headerImageUrl || ""} fields={selectedTemplate.fields as unknown as PDFOverlayField[]} fieldValues={formattedFieldValues} />
              </div>
            ) : selectedTemplate?.content === "DOCX_OVERLAY" ? (
              <div className="bg-white rounded-xl shadow-inner border border-slate-800" style={{ height: "600px" }}>
                <DocxViewerUrl url={selectedTemplate.headerImageUrl || ""} fields={(fields as any[]).map((f) => ({ ...f, valueText: f.valueText || "" }))} fieldValues={formattedFieldValues} />
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-inner border border-slate-200 h-150 overflow-auto">
                <div style={{ minWidth: "210mm", minHeight: "270mm", padding: "20mm" }}>
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
          </Card>

          {/* Uploaded file reference */}
          {uploadedFileName && (
            <Card glass className="mt-4">
              <h3 className="text-xs font-semibold text-slate-900 mb-2">File Referensi</h3>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                {uploadedFileName}
              </div>
            </Card>
          )}
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <Button variant="ghost" onClick={onBack}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Kembali
        </Button>
        <Button onClick={onNext} disabled={!canProceed()}>
          Tinjau
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>
    </div>
  );
}
