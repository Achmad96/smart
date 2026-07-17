/**
 * Pattern-based field detection for correspondence documents.
 * Identifies common editable regions: names, dates, IDs, etc.
 */

export interface DetectedField {
  id: string;
  label: string;
  value: string;           // The original detected value
  placeholder: string;     // The {{placeholder}} name
  startIndex: number;      // Position in text
  endIndex: number;
  type: 'text' | 'textarea' | 'date' | 'number' | 'email';
  confidence: number;      // 0–1 detection confidence
}

// Patterns for Indonesian & general correspondence
const PATTERNS: { label: string; regex: RegExp; type: DetectedField['type']; placeholder: string }[] = [
  // Indonesian dates: "28 Mei 2025", "15 Juni 2026"
  {
    label: 'Tanggal',
    regex: /\b(\d{1,2}\s+(?:Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+\d{4})\b/gi,
    type: 'date',
    placeholder: 'tanggal',
  },
  // City, Date format: "Surabaya, 28 Mei 2025"
  {
    label: 'Tempat & Tanggal',
    regex: /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*,\s*\d{1,2}\s+(?:Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+\d{4})\b/g,
    type: 'text',
    placeholder: 'tempat_tanggal',
  },
  // NIM / ID numbers: "09020623015", "NIM: 09020623015", "NIM. 09020623015"
  {
    label: 'NIM',
    regex: /(?:NIM[.:]\s*)(\d{8,15})/gi,
    type: 'text',
    placeholder: 'nim',
  },
  // Kelas / Class: "Kelas: H6A1"
  {
    label: 'Kelas',
    regex: /(?:Kelas[.:]\s*)([A-Z0-9]{2,10})/gi,
    type: 'text',
    placeholder: 'kelas',
  },
  // "Nama:" field
  {
    label: 'Nama',
    regex: /(?:Nama[.:]\s*)([A-Z][a-zA-Z\s.]+)/g,
    type: 'text',
    placeholder: 'nama',
  },
  // "Kepada Yth:" recipient
  {
    label: 'Kepada',
    regex: /(?:Kepada\s+Yth[.:]\s*)([A-Z][a-zA-Z\s.,]+)/g,
    type: 'text',
    placeholder: 'kepada',
  },
  // English dates: "June 15, 2026"
  {
    label: 'Date',
    regex: /\b((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})\b/gi,
    type: 'date',
    placeholder: 'date',
  },
  // ISO dates: "2026-06-15"
  {
    label: 'Date',
    regex: /\b(\d{4}-\d{2}-\d{2})\b/g,
    type: 'date',
    placeholder: 'date',
  },
  // Email addresses
  {
    label: 'Email',
    regex: /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g,
    type: 'email',
    placeholder: 'email',
  },
];

let fieldCounter = 0;

function makeId(): string {
  return `field_${++fieldCounter}`;
}

export function detectFields(text: string): DetectedField[] {
  fieldCounter = 0;
  const fields: DetectedField[] = [];
  const usedRanges: [number, number][] = [];

  // Check overlap with existing detections
  function overlaps(start: number, end: number): boolean {
    return usedRanges.some(([s, e]) => start < e && end > s);
  }

  for (const pattern of PATTERNS) {
    let match: RegExpExecArray | null;
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);

    while ((match = regex.exec(text)) !== null) {
      // Use capture group if exists, otherwise full match
      const value = match[1] || match[0];
      const startIndex = match.index + (match[0].indexOf(value));
      const endIndex = startIndex + value.length;

      if (!overlaps(startIndex, endIndex) && value.trim().length > 1) {
        usedRanges.push([startIndex, endIndex]);
        const suffix = fields.filter((f) => f.placeholder.startsWith(pattern.placeholder)).length;
        fields.push({
          id: makeId(),
          label: pattern.label + (suffix > 0 ? ` ${suffix + 1}` : ''),
          value: value.trim(),
          placeholder: pattern.placeholder + (suffix > 0 ? `_${suffix + 1}` : ''),
          startIndex,
          endIndex,
          type: pattern.type,
          confidence: 0.8,
        });
      }
    }
  }

  // Sort by position in text
  fields.sort((a, b) => a.startIndex - b.startIndex);
  return fields;
}

/**
 * Replace detected field values with {{placeholder}} markers
 */
export function createTemplateFromText(
  text: string,
  fields: DetectedField[]
): string {
  // Sort fields by position, descending (replace from end to preserve indices)
  const sorted = [...fields].sort((a, b) => b.startIndex - a.startIndex);
  let result = text;

  for (const field of sorted) {
    const before = result.slice(0, field.startIndex);
    const after = result.slice(field.endIndex);
    result = before + `{{${field.placeholder}}}` + after;
  }

  return result;
}

/**
 * Let user manually mark a text selection as a field
 */
export function addManualField(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  label: string
): DetectedField {
  const value = text.slice(selectionStart, selectionEnd).trim();
  const placeholder = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');

  return {
    id: makeId(),
    label,
    value,
    placeholder,
    startIndex: selectionStart,
    endIndex: selectionEnd,
    type: 'text',
    confidence: 1.0,
  };
}
