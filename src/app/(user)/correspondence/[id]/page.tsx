import { getCorrespondenceById } from "@/actions/correspondence.actions";
import { notFound } from "next/navigation";
import Card from "@/components/ui/Card";
import { formatDateTime, formatFieldValuesForDocx } from "@/lib/utils";
import type { TemplateField } from "@/types";

import CorrespondenceHeader from "./_components/CorrespondenceHeader";
import CorrespondencePreview from "./_components/CorrespondencePreview";
import FilledFields from "./_components/FilledFields";

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
      <CorrespondenceHeader
        correspondence={correspondence}
        template={template}
        fields={fields}
        formattedFieldValues={formattedFieldValues}
        isDocxOverlay={isDocxOverlay}
        headerImageUrl={headerImageUrl}
      />

      <CorrespondencePreview
        correspondence={correspondence}
        isPdfOverlay={isPdfOverlay}
        isDocxOverlay={isDocxOverlay}
        fields={fields}
        formattedFieldValues={formattedFieldValues}
        headerImageUrl={headerImageUrl}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 no-print">
        <FilledFields fields={fields} fieldValues={fieldValues} />

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

