'use client';

import React from 'react';

interface DocumentRendererProps {
  content: string;
  className?: string;
}

/**
 * Renders plain text as a formatted formal letter/document.
 * Parses the text structure and applies appropriate alignment and styling.
 */
export default function DocumentRenderer({ content, className = '' }: DocumentRendererProps) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines — add spacing
    if (!trimmed) {
      elements.push(<div key={`space-${i}`} className="h-4" />);
      i++;
      continue;
    }

    // Detect centered title-like lines (first non-empty block, short, possibly uppercase/bold)
    if (i <= findFirstContentLine(lines) + 2 && trimmed.length < 60 && isLikelyTitle(trimmed)) {
      elements.push(
        <p key={`title-${i}`} className="text-center font-bold text-base mb-1 underline underline-offset-4">
          {trimmed}
        </p>
      );
      i++;
      continue;
    }

    // Detect right-aligned lines (city+date pattern, signature blocks at bottom)
    if (isRightAlignedLine(trimmed, i, lines.length)) {
      // Collect consecutive right-aligned lines
      const rightBlock: string[] = [trimmed];
      let j = i + 1;
      while (j < lines.length && (lines[j].trim() === '' || isRightAlignedLine(lines[j].trim(), j, lines.length))) {
        if (lines[j].trim()) rightBlock.push(lines[j].trim());
        else rightBlock.push('');
        j++;
      }
      elements.push(
        <div key={`right-${i}`} className="text-right mt-4">
          {rightBlock.map((rl, ri) =>
            rl === '' ? (
              <div key={ri} className="h-4" />
            ) : (
              <p key={ri} className={`${isSignatureName(rl) ? 'font-bold underline underline-offset-4' : ''}`}>
                {rl}
              </p>
            )
          )}
        </div>
      );
      i = j;
      continue;
    }

    // Detect centered lines (like "Dengan hormat," or short formal phrases)
    if (isCenteredLine(trimmed)) {
      elements.push(
        <p key={`center-${i}`} className="text-center my-2">
          {trimmed}
        </p>
      );
      i++;
      continue;
    }

    // Detect indented content (like "Nama:", "NIM:", "Kelas:" blocks)
    if (isLabeledField(trimmed)) {
      elements.push(
        <p key={`field-${i}`} className="ml-16">
          {trimmed}
        </p>
      );
      i++;
      continue;
    }

    // Detect "Kepada Yth:" or similar address blocks
    if (isAddressPrefix(trimmed)) {
      elements.push(
        <p key={`addr-${i}`} className="mt-3 font-medium">
          {trimmed}
        </p>
      );
      i++;
      // Continue collecting address lines
      while (i < lines.length && lines[i].trim() && !lines[i].trim().startsWith('Dengan') && isAddressContinuation(lines[i].trim(), i, lines)) {
        elements.push(
          <p key={`addr-cont-${i}`}>
            {lines[i].trim()}
          </p>
        );
        i++;
      }
      continue;
    }

    // Default: regular paragraph line
    elements.push(
      <p key={`line-${i}`} className="text-justify">
        {trimmed}
      </p>
    );
    i++;
  }

  return (
    <div className={`font-serif text-sm leading-relaxed space-y-0.5 ${className}`}>
      {elements}
    </div>
  );
}

// --- Helper functions ---

function findFirstContentLine(lines: string[]): number {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim()) return i;
  }
  return 0;
}

function isLikelyTitle(text: string): boolean {
  // Short, possibly with capital letters, looks like a document title
  if (text.length > 60) return false;
  // Common Indonesian letter title patterns
  const titlePatterns = [
    /^surat\s/i,
    /^undangan\s/i,
    /^pengumuman\s/i,
    /^permohonan\s/i,
    /^laporan\s/i,
    /^berita\s+acara/i,
    /^nota\s+dinas/i,
    /^memorandum/i,
    /^surat\s+keputusan/i,
  ];
  if (titlePatterns.some((p) => p.test(text))) return true;
  // Mostly uppercase letters
  const upperCount = (text.match(/[A-Z]/g) || []).length;
  if (text.length > 5 && upperCount / text.replace(/\s/g, '').length > 0.6) return true;
  return false;
}

function isRightAlignedLine(text: string, lineIndex: number, totalLines: number): boolean {
  // Lines in the bottom 40% of the document that look like signatures
  const isBottomHalf = lineIndex > totalLines * 0.6;

  // City + date patterns
  if (/^[A-Z][a-z]+,\s*\d{1,2}\s/i.test(text)) return true;
  if (/^[A-Z][a-z]+,\s*\d{1,2}\s+\w+\s+\d{4}/i.test(text)) return true;

  // "Hormat saya," "Hormat kami," "Ttd," etc.
  if (/^(hormat\s+(saya|kami)|tertanda|ttd|yang\s+membuat)/i.test(text)) return true;

  // Signature names (in bottom half, short capitalized text)
  if (isBottomHalf && text.length < 40 && /^[A-Z]/.test(text)) {
    // Looks like a name
    if (/^[A-Z][a-z]+(\s+[A-Z][a-z.]+)*$/.test(text)) return true;
    if (/^NIM[.:]\s/i.test(text)) return true;
  }

  return false;
}

function isSignatureName(text: string): boolean {
  // Name-like pattern that should be bold+underlined
  if (/^[A-Z][a-z]+(\s+[A-Z][a-z.]+)+$/.test(text)) return true;
  return false;
}

function isCenteredLine(text: string): boolean {
  // Very short formal phrases that are typically centered
  if (/^dengan\s+hormat/i.test(text)) return false; // This is usually left-aligned
  return false;
}

function isLabeledField(text: string): boolean {
  // "Nama: ...", "NIM: ...", "Kelas: ..." — typically indented in letters
  return /^(Nama|NIM|Kelas|Jabatan|Pangkat|Alamat|Telepon|No\.?\s*Telp|Unit\s+Kerja)[.:]\s/i.test(text);
}

function isAddressPrefix(text: string): boolean {
  return /^(Kepada\s+Yth[.:]|Yth[.:]|Kepada\s*:)/i.test(text);
}

function isAddressContinuation(text: string, lineIndex: number, lines: string[]): boolean {
  // Lines that follow an address prefix — typically institution names, faculty, etc.
  if (text.length > 70) return false;
  if (/^(Dosen|Program\s+Studi|Fakultas|Universitas|Jurusan|Bagian|di\s)/i.test(text)) return true;
  // Check if the previous line was also an address
  if (lineIndex > 0 && lines[lineIndex - 1].trim().length < 60 && !lines[lineIndex - 1].trim().startsWith('Dengan')) {
    // Short line following short address lines
    if (text.length < 60 && /^[A-Z]/.test(text)) return true;
  }
  return false;
}
