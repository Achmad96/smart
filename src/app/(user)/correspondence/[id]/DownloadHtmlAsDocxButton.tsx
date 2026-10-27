"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { asBlob } from "html-docx-js-typescript";

interface DownloadHtmlAsDocxButtonProps {
  htmlContent: string;
  downloadTitle?: string;
}

export default function DownloadHtmlAsDocxButton({ htmlContent, downloadTitle }: DownloadHtmlAsDocxButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${downloadTitle || "document"}</title>
  <style>
    body { font-family: "Times New Roman", serif; font-size: 12pt; line-height: 1.5; }
    p { margin-bottom: 10px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid black; padding: 5px; }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>`;

      const blob = (await asBlob(fullHtml)) as Blob;
      
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
      Unduh sebagai Word
    </Button>
  );
}
