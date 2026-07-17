export interface TemplateField {
  name: string;
  label: string;
  valueText?: string;
  type: "text" | "textarea" | "date" | "email" | "number" | "select" | "list_ordered" | "list_unordered" | "table";
  required: boolean;
  placeholder?: string;
  options?: string[]; // For select type
  occurrenceIndex?: number;
}

export interface TemplateData {
  id: string;
  name: string;
  description: string | null;
  category: string;
  fields: TemplateField[];
  content: string;
  headerImageUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CorrespondenceData {
  id: string;
  title: string;
  templateId: string;
  template?: TemplateData;
  fieldValues: Record<string, string>;
  renderedContent: string | null;
  uploadedFileUrl: string | null;
  uploadedFileName: string | null;
  status: "draft" | "submitted" | "approved" | "rejected";
  adminNotes: string | null;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  drafts: number;
  recentActivity: CorrespondenceData[];
}
