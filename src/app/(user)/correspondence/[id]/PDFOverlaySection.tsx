'use client';

import { useState, useCallback } from 'react';
import PDFOverlayPreview from '@/components/ui/PDFOverlayPreview';
import type { PDFOverlayField } from '@/lib/pdf-overlay';
import PrintButton from './PrintButton';

interface PDFOverlaySectionProps {
  fileUrl: string;
  fields: PDFOverlayField[];
  fieldValues: Record<string, string>;
  title: string;
}

/**
 * Client wrapper that connects PDFOverlayPreview to PrintButton,
 * so the generated PDF blob URL can be used for direct download
 * instead of window.print() which cannot capture iframe content.
 */
export default function PDFOverlaySection({ fileUrl, fields, fieldValues, title }: PDFOverlaySectionProps) {
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  const handlePdfUrlReady = useCallback((url: string | null) => {
    setPdfBlobUrl(url);
  }, []);

  return (
    <>
      <div className="flex items-center justify-between mb-4 no-print">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Pratinjau Dokumen
        </h3>
        <PrintButton pdfBlobUrl={pdfBlobUrl} downloadTitle={title} />
      </div>
      <div className="w-full overflow-x-auto pb-4">
        <div id="print-content" className="mx-auto w-max no-print-padding print-exact">
          <div className="w-full h-full">
            <PDFOverlayPreview
              fileUrl={fileUrl}
              fields={fields}
              fieldValues={fieldValues}
              onPdfUrlReady={handlePdfUrlReady}
            />
          </div>
        </div>
      </div>
    </>
  );
}
