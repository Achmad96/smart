'use client';

/**
 * Extract text from various file types (Image, PDF, DOCX)
 */
export async function extractText(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const imageExts = ['png', 'jpg', 'jpeg', 'bmp', 'webp', 'tiff', 'tif'];
  
  if (imageExts.includes(ext)) {
    return extractTextFromImage(file);
  } else if (ext === 'pdf') {
    return extractTextFromPDF(file);
  } else if (ext === 'docx' || ext === 'doc') {
    return extractTextFromDOCX(file);
  } else {
    throw new Error(`Unsupported file type: .${ext}`);
  }
}

export async function extractTextFromImage(file: File, onProgress?: (progress: number) => void): Promise<string> {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('ind+eng', undefined, {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(Math.round(m.progress * 100));
      }
    },
  });
  const url = URL.createObjectURL(file);
  try {
    const { data } = await worker.recognize(url);
    return data.text;
  } finally {
    URL.revokeObjectURL(url);
    await worker.terminate();
  }
}

export async function extractTextFromPDF(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');

  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  console.log(pdfjsLib.version);
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const textParts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
    textParts.push(pageText);
  }

  return textParts.join('\n\n');
}

export async function extractTextFromDOCX(file: File): Promise<string> {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}
