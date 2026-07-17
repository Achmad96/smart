'use client';

import { useState, useCallback } from 'react';
import Button from '@/components/ui/Button';

interface PrintButtonProps {
  /** For PDF_OVERLAY documents, the actual PDF blob URL to download */
  pdfBlobUrl?: string | null;
  /** Title used for the downloaded PDF filename */
  downloadTitle?: string;
}

export default function PrintButton({ pdfBlobUrl, downloadTitle }: PrintButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleClick = useCallback(() => {
    if (pdfBlobUrl) {
      // For PDF overlay documents: download the actual generated PDF
      setIsDownloading(true);
      try {
        const a = document.createElement('a');
        a.href = pdfBlobUrl;
        a.download = `${downloadTitle || 'document'}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } finally {
        setIsDownloading(false);
      }
    } else {
      // For non-overlay documents: use browser print
      window.print();
    }
  }, [pdfBlobUrl, downloadTitle]);

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleClick}
      isLoading={isDownloading}
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {pdfBlobUrl ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2z" />
        )}
      </svg>
      {pdfBlobUrl ? 'Unduh PDF' : 'Simpan sebagai PDF'}
    </Button>
  );
}
