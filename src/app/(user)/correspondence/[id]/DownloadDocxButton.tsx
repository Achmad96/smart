"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { fillDocx } from "@/lib/docx-filler";

interface DownloadDocxButtonProps {
  url: string;
  fields: any[];
  fieldValues: Record<string, string>;
  downloadTitle?: string;
}

export default function DownloadDocxButton({ url, fields, fieldValues, downloadTitle }: DownloadDocxButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load document");
      const arrayBuffer = await res.arrayBuffer();

      const blob = fillDocx(arrayBuffer, fields, fieldValues);

      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `${downloadTitle || "document"}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Error downloading DOCX:", err);
      alert("Gagal mengunduh dokumen. Silakan coba lagi.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button variant="secondary" size="sm" onClick={handleDownload} isLoading={isDownloading}>
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Unduh Dokumen
    </Button>
  );
}
