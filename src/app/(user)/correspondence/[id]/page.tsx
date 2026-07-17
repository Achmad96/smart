import { getCorrespondenceById } from "@/actions/correspondence.actions";
import { notFound } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { formatDateTime, getCategoryColor, formatFieldValuesForDocx } from "@/lib/utils";
import type { TemplateField } from "@/types";
import type { PDFOverlayField } from "@/lib/pdf-overlay";
import PrintButton from "./PrintButton";
import PDFOverlaySection from "./PDFOverlaySection";
import DocxViewerUrl from "@/components/ui/DocxViewerUrl";
import DownloadDocxButton from "./DownloadDocxButton";

export const dynamic = "force-dynamic";

export default async function CorrespondenceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const correspondence = await getCorrespondenceById(id);
  if (!correspondence) notFound();

  const template = correspondence.template;
  const fieldValues = (correspondence.fieldValues as Record<string, string>) || {};
  const fields = (template?.fields as unknown as TemplateField[]) || [];

  const formattedFieldValues = formatFieldValuesForDocx(fieldValues, fields);

  const headerImageUrl = (template as Record<string, unknown>)?.headerImageUrl as string | null;
  const isPdfOverlay = template?.content === "PDF_OVERLAY";
  const isDocxOverlay = template?.content === "DOCX_OVERLAY";

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-bold text-slate-900">{correspondence.title}</h2>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={getCategoryColor(template?.category || "")}>{template?.name}</Badge>
            <span className="text-xs text-slate-500" suppressHydrationWarning>
              Dibuat pada {formatDateTime(correspondence.createdAt)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href={`/correspondence/${correspondence.id}/edit`} className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-all rounded-xl shadow-sm text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500/20 active:scale-95 disabled:opacity-50 disabled:pointer-events-none no-print">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </Link>
          {isDocxOverlay && <DownloadDocxButton url={correspondence.uploadedFileUrl || headerImageUrl || ""} fields={fields} fieldValues={formattedFieldValues} downloadTitle={correspondence.title} />}
          {/* {!isPdfOverlay && <PrintButton />} */}
        </div>
      </div>

      <Card glass>
        {isPdfOverlay ? (
          <PDFOverlaySection fileUrl={correspondence.uploadedFileUrl || headerImageUrl || ""} fields={fields as unknown as PDFOverlayField[]} fieldValues={formattedFieldValues} title={correspondence.title} />
        ) : (
          <>
            <div className="flex items-center justify-between mb-4 no-print">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Pratinjau Dokumen
              </h3>
            </div>
            <div className="w-full overflow-x-auto pb-4">
              <div
                id="print-content"
                className={isDocxOverlay ? "mx-auto w-full no-print-padding print-exact bg-white rounded-xl shadow-lg border border-slate-200" : "bg-white rounded-xl mx-auto shadow-lg border border-slate-200"}
                style={isDocxOverlay ? { minHeight: "270mm" } : { width: "max-content", minWidth: "210mm", minHeight: "270mm", padding: "20mm" }}>
                {isDocxOverlay ? (
                  <div className="w-full h-full">
                    <DocxViewerUrl url={correspondence.uploadedFileUrl || headerImageUrl || ""} fields={fields as unknown as { name: string; valueText: string }[]} fieldValues={formattedFieldValues} />
                  </div>
                ) : (
                  <>
                    {headerImageUrl && (
                      <div className="mb-6 flex justify-center">
                        <img src={headerImageUrl} alt="Letterhead" className="max-h-24 object-contain" />
                      </div>
                    )}

                    {correspondence.renderedContent?.includes("<p>") || correspondence.renderedContent?.includes("<table>") ? (
                      <div className="text-sm text-gray-900 font-serif leading-relaxed docx-preview-content" dangerouslySetInnerHTML={{ __html: correspondence.renderedContent || "" }} />
                    ) : (
                      <pre className="text-sm text-gray-900 whitespace-pre-wrap font-serif leading-relaxed">{correspondence.renderedContent || "Tidak ada konten yang dirender tersedia"}</pre>
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 no-print">
        <Card glass>
          <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Kolom Terisi
          </h3>
          <div className="space-y-3">
            {fields.map((field) => (
              <div key={field.name} className="py-2 border-b border-slate-200 last:border-0">
                <p className="text-xs text-slate-500 mb-1">{field.label}</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{fieldValues[field.name] || <span className="text-slate-600 italic">Tidak diisi</span>}</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          {correspondence.uploadedFileUrl && (
            <Card glass>
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                File Terlampir
              </h3>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-100">
                <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-slate-700">{correspondence.uploadedFileName}</p>
                  <a href={correspondence.uploadedFileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
                    Lihat file →
                  </a>
                </div>
              </div>

              {/\.(png|jpg|jpeg|webp|bmp)$/i.test(correspondence.uploadedFileUrl) && (
                <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 bg-white">
                  <img src={correspondence.uploadedFileUrl} alt="Attached document" className="w-full h-auto" />
                </div>
              )}
            </Card>
          )}

          <Card glass>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Lini Masa</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-slate-400" />
                <p className="text-xs text-slate-500" suppressHydrationWarning>
                  Dibuat pada {formatDateTime(correspondence.createdAt)}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
