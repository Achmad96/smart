export const APP_NAME = "SMART";
export const APP_DESCRIPTION = "Correspondence Management System";

export const FIELD_TYPES = [
  { value: "text", label: "Teks" },
  { value: "textarea", label: "Area Teks" },
  { value: "date", label: "Tanggal" },
  { value: "email", label: "Email" },
  { value: "number", label: "Angka" },
  { value: "select", label: "Pilihan / Dropdown" },
  { value: "list_ordered", label: "Daftar (Berurutan)" },
  { value: "list_unordered", label: "Daftar (Tidak Berurutan)" },
  { value: "table", label: "Tabel" },
] as const;

export const CATEGORIES = [
  { value: "official", label: "Surat Resmi" },
  { value: "internal", label: "Memo Internal" },
  { value: "invitation", label: "Undangan" },
  { value: "request", label: "Permintaan" },
  { value: "notification", label: "Notifikasi" },
  { value: "permit", label: "Izin / Otorisasi" },
] as const;

export const STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Dikirim" },
  { value: "approved", label: "Disetujui" },
  { value: "rejected", label: "Ditolak" },
] as const;

export const ACCEPTED_FILE_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/msword": [".doc"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
