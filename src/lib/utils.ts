import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { TemplateField } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function buildSearchRegexStr(valueText: string, exactDots = false): string {
  const trimmed = valueText.trim();
  if (!trimmed) return "";

  if (exactDots) {
    let lit = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    lit = lit.replace(/\s+/g, "\\s*");
    return lit;
  }

  const tokens: { type: "literal" | "dots"; text?: string }[] = [];
  const dotRegex = /((?:\.\s*){3,}|(?:_\s*){3,})/g;
  let lastIndex = 0;
  let match;

  while ((match = dotRegex.exec(trimmed)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: "literal", text: trimmed.substring(lastIndex, match.index) });
    }
    tokens.push({ type: "dots" });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < trimmed.length) {
    tokens.push({ type: "literal", text: trimmed.substring(lastIndex) });
  }

  let regexStr = "";
  for (const token of tokens) {
    if (token.type === "dots") {
      regexStr += "(?:[\\._][\\s]*){3,}";
    } else if (token.text) {
      let lit = token.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      lit = lit.replace(/\s+/g, "\\s*");
      regexStr += lit;
    }
  }

  return regexStr;
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function renderFieldValueAsHtml(value: string, field: TemplateField): string | null {
  try {
    if (field.type === "list_ordered") {
      const items = JSON.parse(value);
      if (Array.isArray(items)) {
        return `<ol style="padding-left: 20px; list-style-type: decimal; margin: 10px 0;">\n${items.map(i => `<li>${i}</li>`).join('\n')}\n</ol>`;
      }
    } else if (field.type === "list_unordered") {
      const items = JSON.parse(value);
      if (Array.isArray(items)) {
        return `<ul style="padding-left: 20px; list-style-type: disc; margin: 10px 0;">\n${items.map(i => `<li>${i}</li>`).join('\n')}\n</ul>`;
      }
    } else if (field.type === "table") {
      const rows = JSON.parse(value);
      if (Array.isArray(rows) && rows.length > 0) {
        const thead = `<tr style="background-color: #f3f4f6;">${rows[0].map((h: string) => `<th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">${h}</th>`).join('')}</tr>`;
        const tbody = rows.slice(1).map((r: string[]) => `<tr>${r.map((c: string) => `<td style="border: 1px solid #d1d5db; padding: 8px;">${c}</td>`).join('')}</tr>`).join('\n');
        return `<table style="width: 100%; border-collapse: collapse; margin: 10px 0;">\n<thead>\n${thead}\n</thead>\n<tbody>\n${tbody}\n</tbody>\n</table>`;
      }
    } else if (field.type === "date" && value) {
      return formatDate(value);
    }
  } catch {
    return null;
  }
  return null;
}

function formatFieldForDocx(value: string, field: TemplateField): string | null {
  try {
    if (field.type === "list_ordered") {
      const items = JSON.parse(value);
      if (Array.isArray(items)) return items.map((item, i) => `${i + 1}. ${item}`).join('\n');
    } else if (field.type === "list_unordered") {
      const items = JSON.parse(value);
      if (Array.isArray(items)) return items.map((item) => `• ${item}`).join('\n');
    } else if (field.type === "table") {
      const rows = JSON.parse(value);
      if (Array.isArray(rows) && rows.length > 0) return rows.map((r: string[]) => r.join(' | ')).join('\n');
    } else if (field.type === "date" && value) {
      return formatDate(value);
    }
  } catch {
    return null;
  }
  return null;
}

export function renderTemplate(
  content: string,
  values: Record<string, string>,
  fields?: TemplateField[]
): string {
  let rendered = content;
  for (const [key, value] of Object.entries(values)) {
    let finalValue = value || "";

    if (fields && value) {
      const field = fields.find(f => f.name === key);
      if (field) {
        finalValue = renderFieldValueAsHtml(value, field) ?? value;
      }
    }

    rendered = rendered.replace(
      new RegExp(`\\{\\{${key}\\}\\}`, "g"),
      finalValue || `{{${key}}}`
    );
  }
  return rendered;
}

export function formatFieldValuesForDocx(
  values: Record<string, string>,
  fields?: TemplateField[]
): Record<string, string> {
  const formatted: Record<string, string> = { ...values };
  if (!fields) return formatted;

  for (const field of fields) {
    const val = formatted[field.name];
    if (!val) continue;
    const result = formatFieldForDocx(val, field);
    if (result !== null) formatted[field.name] = result;
  }
  return formatted;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  submitted: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  rejected: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

const CATEGORY_COLORS: Record<string, string> = {
  official: "bg-primary-500/10 text-primary-400 border-primary-500/20",
  internal: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  invitation: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  request: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  notification: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  permit: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

const DEFAULT_COLOR = "bg-slate-500/10 text-slate-500 border-slate-500/20";

export function getStatusColor(status: string): string {
  return STATUS_COLORS[status] ?? DEFAULT_COLOR;
}

export function getStatusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? DEFAULT_COLOR;
}
