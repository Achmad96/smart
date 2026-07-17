import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';


export interface PDFTextItem {
  str: string;
  width: number;
  height: number;
  transform: number[];
  pageIndex: number;
  x: number;
  y: number;
  font: StandardFonts;
  fontSize: number;
}

export interface ExtractedPDFData {
  text: string;
  items: PDFTextItem[];
  itemMap: { startIndex: number; endIndex: number; itemIndex: number }[];
}

export interface PDFOverlayField {
  id: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
  placeholder: string;
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  rects?: { x: number; y: number; width: number; height: number }[];
  startY?: number;
}

export async function checkIfPdfIsEncrypted(file: File): Promise<boolean> {
  const arrayBuffer = await file.arrayBuffer();
  try {
    await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    return false;
  } catch (e: any) {
    if (e.message?.toLowerCase().includes('encrypted')) {
      return true;
    }
    throw e;
  }
}

export async function extractTextWithCoordinates(file: File): Promise<ExtractedPDFData> {
  const pdfjsLib = await import('pdfjs-dist');
  
  if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  const items: PDFTextItem[] = [];
  const itemMap: { startIndex: number; endIndex: number; itemIndex: number }[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    
    const pageItems: PDFTextItem[] = [];
    
    for (const rawItem of content.items) {
      if (!('str' in rawItem)) continue;
      
      const str = rawItem.str;
      const transform = rawItem.transform;
      const fontSize = Math.abs(transform[3]) || Math.abs(transform[0]);
      const x = transform[4];
      const y = transform[5];
      
      pageItems.push({
        str,
        width: rawItem.width,
        height: rawItem.height,
        transform,
        pageIndex: i - 1,
        x,
        y,
        font: StandardFonts.TimesRoman,
        fontSize
      });
    }
    
    // Group items into lines to handle slight Y variations, then sort top-to-bottom, left-to-right
    // PDF coordinates: Y is bottom-up. So larger Y is higher on the page.
    // We sort Y descending, X ascending.
    pageItems.sort((a, b) => {
      const yDiff = b.y - a.y;
      // If Y difference is less than half the font size, consider them on the same line
      if (Math.abs(yDiff) < Math.max(a.fontSize, b.fontSize) * 0.4) {
        return a.x - b.x;
      }
      return yDiff;
    });

    let lastY: number | null = null;
    let lastX: number | null = null;

    for (const item of pageItems) {
      // Add newline if Y changed significantly
      if (lastY !== null && Math.abs(lastY - item.y) > item.fontSize * 0.4) {
        if (!fullText.endsWith('\n') && !fullText.endsWith(' ')) {
          fullText += '\n';
        }
      } else if (lastX !== null && item.x - lastX > item.fontSize * 0.5) {
        // Add space if there is a significant X gap between items on the same line
        if (!fullText.endsWith('\n') && !fullText.endsWith(' ')) {
          fullText += ' ';
        }
      }
      
      if (item.str.trim()) {
        lastY = item.y;
        lastX = item.x + item.width;
      } else if (item.str.length > 0) {
        // It's a space character in the PDF
        lastX = item.x + item.width;
      }
      
      // skip completely empty items (zero length)
      if (item.str.length === 0) continue;

      const itemIndex = items.length;
      items.push(item);
      
      const startIndex = fullText.length;
      fullText += item.str;
      const endIndex = fullText.length;
      
      itemMap.push({ startIndex, endIndex, itemIndex });
    }
    
    // Add newline at end of page
    if (fullText && !fullText.endsWith('\n')) {
      fullText += '\n';
    }
  }

  return { text: fullText, items, itemMap };
}

export function getFieldCoordinatesFromRange(data: ExtractedPDFData, startIndex: number, endIndex: number) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let pageIndex = -1;
  let fontSize = 0;
  let startY = -1;
  
  const rects: { x: number; y: number; width: number; height: number }[] = [];
  
  for (const map of data.itemMap) {
    // Check if this item overlaps with our target range
    if (map.startIndex < endIndex && map.endIndex > startIndex) {
      const item = data.items[map.itemIndex];
      if (pageIndex === -1) pageIndex = item.pageIndex;
      // If text spans multiple pages, just take the first page for simplicity
      if (item.pageIndex !== pageIndex) continue;
      
      minX = Math.min(minX, item.x);
      minY = Math.min(minY, item.y);
      maxX = Math.max(maxX, item.x + item.width);
      maxY = Math.max(maxY, item.y + item.fontSize);
      fontSize = Math.max(fontSize, item.fontSize);
      
      if (startY === -1 || item.y > startY) {
        startY = item.y;
      }
      
      rects.push({
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.fontSize
      });
    }
  }
  
  if (pageIndex === -1) return null;
  
  // Consolidate rects by line (same Y)
  const lineRects = new Map<number, { x: number; y: number; width: number; height: number }>();
  for (const r of rects) {
    // Group by approximate Y
    const yKey = Math.round(r.y);
    if (!lineRects.has(yKey)) {
      lineRects.set(yKey, { ...r });
    } else {
      const existing = lineRects.get(yKey)!;
      const newMinX = Math.min(existing.x, r.x);
      const newMaxX = Math.max(existing.x + existing.width, r.x + r.width);
      existing.x = newMinX;
      existing.width = newMaxX - newMinX;
      existing.height = Math.max(existing.height, r.height);
    }
  }
  
  return {
    pageIndex,
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
    fontSize,
    startY,
    rects: Array.from(lineRects.values())
  };
}

export async function fillPDFOverlayAsBlob(file: File | ArrayBuffer, fields: PDFOverlayField[], values: Record<string, string>): Promise<Blob> {
  let arrayBuffer: ArrayBuffer;
  if (file instanceof File) {
    arrayBuffer = await file.arrayBuffer();
  } else {
    arrayBuffer = file as ArrayBuffer;
  }
  
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  
  const pages = pdfDoc.getPages();
  
  for (const field of fields) {
    const value = values[field.name] || '';
    if (!value) continue; // Skip if no value provided
    
    const coords = (field as any).coords || field;
    const page = pages[coords.pageIndex];
    if (!page) continue;
    
    // Draw white rectangle to erase old text
    // Add small padding around the text
    const paddingX = 2;
    const paddingY = coords.fontSize * 0.2;
    
    if (coords.rects && coords.rects.length > 0) {
      for (const rect of coords.rects) {
        page.drawRectangle({
          x: rect.x - paddingX,
          y: rect.y - paddingY,
          width: rect.width + (paddingX * 2),
          height: rect.height + (paddingY * 2),
          color: rgb(1, 1, 1),
        });
      }
    } else {
      page.drawRectangle({
        x: coords.x - paddingX,
        y: coords.y - paddingY,
        width: coords.width + (paddingX * 2),
        height: Math.max(coords.height, coords.fontSize) + (paddingY * 2),
        color: rgb(1, 1, 1),
      });
    }
    
    // Clean value to remove unsupported characters (pdf-lib StandardFonts use WinAnsi)
    const safeValue = value
      .replace(/[\u2018\u2019]/g, "'") // Smart single quotes
      .replace(/[\u201C\u201D]/g, '"') // Smart double quotes
      .replace(/[\u2013\u2014]/g, '-') // En and em dashes
      .replace(/[^\x00-\xFF]/g, '');   // Strip other non-Latin characters
      
    // Calculate max allowed height
    const maxAllowedHeight = (coords.rects && coords.rects.length > 0)
      ? coords.rects.length * (coords.fontSize * 1.2)
      : Math.max(coords.height, coords.fontSize * 1.2);
    
    let drawFontSize = coords.fontSize;
    let numLines = 1;
    const maxWidth = coords.width + 10;
    
    // Auto-scale font size down so it fits in the original area
    while (drawFontSize > 6) {
      numLines = getWrappedTextLines(safeValue, font, drawFontSize, maxWidth);
      const requiredHeight = numLines * (drawFontSize * 1.2);
      if (requiredHeight <= maxAllowedHeight) {
        break;
      }
      drawFontSize -= 0.5;
    }

    // Draw new text
    page.drawText(safeValue, {
      x: coords.x,
      y: coords.startY ?? coords.y,
      size: drawFontSize,
      font: font,
      color: rgb(0, 0, 0),
      maxWidth: maxWidth,
      lineHeight: drawFontSize * 1.2,
    });
  }
  
  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes as any], { type: 'application/pdf' });
}

export async function fillPDFOverlay(file: File | ArrayBuffer, fields: PDFOverlayField[], values: Record<string, string>): Promise<string> {
  const blob = await fillPDFOverlayAsBlob(file, fields, values);
  return URL.createObjectURL(blob);
}

export async function generateHighlightPDF(file: File | ArrayBuffer, fields: PDFOverlayField[]): Promise<string> {
  let arrayBuffer: ArrayBuffer;
  if (file instanceof File) {
    arrayBuffer = await file.arrayBuffer();
  } else {
    arrayBuffer = file as ArrayBuffer;
  }
  
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();
  
  for (const field of fields) {
    const coords = (field as any).coords || field;
    const page = pages[coords.pageIndex];
    if (!page) continue;
    
    // Add small padding around the text
    const paddingX = 2;
    const paddingY = coords.fontSize * 0.2;
    
    if (coords.rects && coords.rects.length > 0) {
      for (const rect of coords.rects) {
        page.drawRectangle({
          x: rect.x - paddingX,
          y: rect.y - paddingY,
          width: rect.width + (paddingX * 2),
          height: rect.height + (paddingY * 2),
          color: rgb(1, 1, 0), // Yellow
          opacity: 0.3,
        });
      }
    } else {
      page.drawRectangle({
        x: coords.x - paddingX,
        y: coords.y - paddingY,
        width: coords.width + (paddingX * 2),
        height: Math.max(coords.height, coords.fontSize) + (paddingY * 2),
        color: rgb(1, 1, 0), // Yellow
        opacity: 0.3,
      });
    }
  }
  
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
  return URL.createObjectURL(blob);
}

function getWrappedTextLines(text: string, font: any, size: number, maxWidth: number): number {
  const lines = text.split('\n');
  let totalLines = 0;
  for (const line of lines) {
    if (!line.trim()) {
      totalLines++;
      continue;
    }
    const words = line.split(/\s+/);
    let currentLine = '';
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const width = font.widthOfTextAtSize(testLine, size);
      if (width > maxWidth && currentLine) {
        totalLines++;
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) totalLines++;
  }
  return totalLines;
}
