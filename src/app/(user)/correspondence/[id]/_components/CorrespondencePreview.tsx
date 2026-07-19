import Card from "@/components/ui/Card";
import PDFOverlaySection from "../PDFOverlaySection";
import DocxViewerUrl from "@/components/ui/DocxViewerUrl";
import type { PDFOverlayField } from "@/lib/pdf-overlay";

interface CorrespondencePreviewProps {
  correspondence: any;
  isPdfOverlay: boolean;
  isDocxOverlay: boolean;
  fields: any[];
  formattedFieldValues: Record<string, string>;
  headerImageUrl: string | null;
}

export default function CorrespondencePreview({
  correspondence,
  isPdfOverlay,
  isDocxOverlay,
  fields,
  formattedFieldValues,
  headerImageUrl
}: CorrespondencePreviewProps) {
  return (
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
  );
}
