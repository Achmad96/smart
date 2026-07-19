export interface TemplateOption {
  id: string;
  name: string;
  description: string | null;
  category: string;
  fields: unknown;
  content: string;
  headerImageUrl?: string | null;
}

export type VerifyMessage = { type: "success" | "error"; text: string };
