'use client';

import React, { useEffect, useState, useCallback } from 'react';
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import "@cyntler/react-doc-viewer/dist/index.css";
import { fillPDFOverlay, type PDFOverlayField } from '@/lib/pdf-overlay';

interface PDFOverlayPreviewProps {
  fileUrl: string;
  fields: PDFOverlayField[];
  fieldValues: Record<string, string>;
  onPdfUrlReady?: (url: string | null) => void;
}

export default function PDFOverlayPreview({ fileUrl, fields, fieldValues, onPdfUrlReady }: PDFOverlayPreviewProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const notifyParent = useCallback((url: string | null) => {
    onPdfUrlReady?.(url);
  }, [onPdfUrlReady]);

  useEffect(() => {
    let isMounted = true;
    
    async function loadAndFillPdf() {
      if (!fileUrl) return;
      try {
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error('Failed to load PDF template');
        const arrayBuffer = await response.arrayBuffer();
        
        const url = await fillPDFOverlay(arrayBuffer, fields, fieldValues);
        if (isMounted) {
          setPdfUrl(url);
          notifyParent(url);
        } else {
          URL.revokeObjectURL(url);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error(err);
          setError('Failed to generate PDF preview.');
          notifyParent(null);
        }
      }
    }

    loadAndFillPdf();

    return () => {
      isMounted = false;
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileUrl, JSON.stringify(fields), JSON.stringify(fieldValues)]);

  if (error) {
    return <div className="p-4 text-center text-rose-500 bg-rose-500/10 rounded-xl border border-rose-500/20">{error}</div>;
  }

  if (!pdfUrl) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm">Membuat pratinjau PDF...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border-0">
      <DocViewer 
        documents={[{ uri: pdfUrl, fileType: "pdf", fileName: "document.pdf" }]}
        pluginRenderers={DocViewerRenderers}
        config={{
          header: { disableHeader: true, disableFileName: true, retainURLParams: false }
        }}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
