"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTemplate, updateTemplate, deleteTemplate } from "@/actions/template.actions";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import Card from "@/components/ui/Card";
import { FIELD_TYPES } from "@/lib/constants";
import type { TemplateField } from "@/types";

interface TemplateEditorProps {
  template: {
    id: string;
    name: string;
    description: string | null;
    category: string;
    fields: unknown;
    content: string;
    isActive: boolean;
  } | null;
  categories: { id: string; value: string; label: string; color: string | null }[];
}

export default function TemplateEditor({ template, categories }: TemplateEditorProps) {
  const router = useRouter();
  const isNew = !template;

  const [name, setName] = useState(template?.name || "");
  const [description, setDescription] = useState(template?.description || "");
  const [category, setCategory] = useState(template?.category || (categories && categories.length > 0 ? categories[0].value : "general"));
  const [content, setContent] = useState(template?.content || "");
  const [fields, setFields] = useState<TemplateField[]>((template?.fields as unknown as TemplateField[]) || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addField = () => {
    setFields([...fields, { name: "", label: "", type: "text", required: true, placeholder: "" }]);
  };

  const updateField = (index: number, updates: Partial<TemplateField>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    // Auto-generate name from label
    if (updates.label && !newFields[index].name) {
      newFields[index].name = updates.label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/(^_|_$)/g, "");
    }
    setFields(newFields);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Nama template diperlukan");
      return;
    }
    if (fields.length === 0) {
      setError("Minimal satu kolom diperlukan");
      return;
    }
    if (!content.trim()) {
      setError("Konten template diperlukan");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      if (isNew) {
        await createTemplate({ name, description, category, fields, content });
      } else {
        await updateTemplate(template.id, { name, description, category, fields, content });
      }
      router.push("/manage-templates");
      router.refresh();
    } catch (err) {
      setError("Gagal menyimpan templat");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!template || !confirm("Apakah Anda yakin ingin menghapus template ini?")) return;
    setIsLoading(true);
    try {
      await deleteTemplate(template.id);
      router.push("/manage-templates");
      router.refresh();
    } catch (err) {
      setError("Gagal menghapus templat");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-up max-w-4xl">
      <Card glass>
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Detail Template</h3>
        <div className="space-y-4">
          <Input label="Nama Template" value={name} onChange={(e) => setName(e.target.value)} required placeholder="mis., Surat Resmi" />
          <Textarea label="Deskripsi" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Deskripsi singkat tentang template ini" className="min-h-15" />
          <Select label="Kategori" value={category} onChange={(e) => setCategory(e.target.value)} options={categories.map(c => ({ value: c.value, label: c.label }))} required />
        </div>
      </Card>

      <Card glass>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-900">Kolom Template</h3>
          <Button variant="secondary" size="sm" onClick={addField}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Kolom
          </Button>
        </div>
        <div className="space-y-3">
          {fields.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">Belum ada kolom. Tambahkan kolom yang akan diisi pengguna saat menggunakan template ini.</p>
          ) : (
            fields.map((field, index) => (
              <div key={index} className="flex gap-3 items-start p-3 rounded-xl bg-white/2 border border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 flex-1">
                  <Input placeholder="Label kolom" value={field.label} onChange={(e) => updateField(index, { label: e.target.value })} />
                  <Input placeholder="Nama kolom (otomatis)" value={field.name} onChange={(e) => updateField(index, { name: e.target.value })} />
                  <Input placeholder="Nilai default / teks placeholder" value={field.placeholder || ""} onChange={(e) => updateField(index, { placeholder: e.target.value })} />
                  <Select value={field.type} onChange={(e) => updateField(index, { type: e.target.value as TemplateField["type"] })} options={[...FIELD_TYPES]} />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer">
                    <input type="checkbox" checked={field.required} onChange={(e) => updateField(index, { required: e.target.checked })} className="rounded border-slate-300 bg-slate-100 text-primary-500 focus:ring-primary-500/50" />
                    Wajib isi
                  </label>
                  <button onClick={() => removeField(index)} className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card glass>
        <h3 className="text-sm font-semibold text-slate-900 mb-2">Konten Template</h3>
        <p className="text-xs text-slate-500 mb-3">
          Gunakan sintaks {"{{fieldName}}"} untuk placeholder. Contoh: {"{{recipientName}}"}
        </p>
        <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Masukkan konten template dengan {{placeholders}}..." className="min-h-50 font-mono text-xs" />
      </Card>

      {error && (
        <p className="text-sm text-rose-400 flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button onClick={handleSave} isLoading={isLoading}>
          {isNew ? "Buat Template" : "Simpan Perubahan"}
        </Button>
        <Button variant="secondary" onClick={() => router.back()}>
          Batal
        </Button>
        {!isNew && (
          <Button variant="danger" onClick={handleDelete} className="ml-auto">
            Hapus
          </Button>
        )}
      </div>
    </div>
  );
}
