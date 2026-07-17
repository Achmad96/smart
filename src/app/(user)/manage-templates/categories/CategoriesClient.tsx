"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCategory, updateCategory, deleteCategory } from "@/actions/category.actions";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import Link from "next/link";

interface Category {
  id: string;
  value: string;
  label: string;
  color: string | null;
}

export default function CategoriesClient({ initialCategories }: { initialCategories: Category[] }) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ value: "", label: "", color: "" });
  const [isLoading, setIsLoading] = useState(false);

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setForm({ value: cat.value, label: cat.label, color: cat.color || "" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ value: "", label: "", color: "" });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.value || !form.label) return;
    setIsLoading(true);
    
    try {
      if (editingId) {
        await updateCategory(editingId, { ...form });
      } else {
        await createCategory({ ...form });
      }
      // Optimistic update would be better, but refresh is easier
      router.refresh();
      cancelEdit();
      // Wait a moment for refresh to happen, then we can also manually update local state if needed
      // but let's rely on server refresh for simplicity.
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan kategori. Pastikan value unik.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus kategori ini? Template yang menggunakannya mungkin kehilangan badge warnanya.")) return;
    setIsLoading(true);
    try {
      await deleteCategory(id);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus kategori.");
    } finally {
      setIsLoading(false);
    }
  };

  const DEFAULT_COLORS = [
    "bg-primary-500/10 text-primary-400 border-primary-500/20",
    "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    "bg-violet-500/10 text-violet-400 border-violet-500/20",
    "bg-amber-500/10 text-amber-400 border-amber-500/20",
    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    "bg-rose-500/10 text-rose-400 border-rose-500/20",
    "bg-slate-500/10 text-slate-500 border-slate-500/20",
  ];

  return (
    <div className="max-w-4xl space-y-6 animate-fade-up">
      <div className="flex items-center gap-4">
        <Link href="/manage-templates" className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-slate-900">Kelola Kategori Template</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card glass className="sticky top-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">{editingId ? "Edit Kategori" : "Kategori Baru"}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <Input label="Value (Unik)" placeholder="mis., official" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} required />
              <Input label="Label (Tampilan)" placeholder="mis., Surat Resmi" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required />
              
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Warna Badge (Opsional)</label>
                <select 
                  className="w-full h-11 px-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all appearance-none"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                >
                  <option value="">(Default Abu-abu)</option>
                  {DEFAULT_COLORS.map(c => (
                    <option key={c} value={c}>{c.split(" ")[1].replace("text-", "")}</option>
                  ))}
                </select>
                {form.color && (
                  <div className="mt-3">
                    <Badge className={form.color}>Pratinjau Badge</Badge>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" isLoading={isLoading} className="flex-1">
                  {editingId ? "Simpan" : "Tambah"}
                </Button>
                {editingId && (
                  <Button type="button" variant="secondary" onClick={cancelEdit}>
                    Batal
                  </Button>
                )}
              </div>
            </form>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card glass>
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Daftar Kategori</h3>
            <div className="space-y-2">
              {initialCategories.length === 0 && <p className="text-sm text-slate-500">Belum ada kategori.</p>}
              {initialCategories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between p-3 rounded-xl bg-white/40 border border-slate-200 hover:border-slate-300 transition-all">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900">{cat.label}</span>
                      <span className="text-xs text-slate-400 font-mono">({cat.value})</span>
                    </div>
                    <div className="mt-2">
                      <Badge className={cat.color || "bg-slate-500/10 text-slate-500 border-slate-500/20"}>{cat.label}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(cat)} className="p-2 rounded-lg text-slate-400 hover:text-primary-500 hover:bg-primary-500/10 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button onClick={() => handleDelete(cat.id)} className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
