"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getCategories } from "@/actions/category.actions";
import { updateCorrespondence } from "@/actions/correspondence.actions";
import { getWargaByNik } from "@/actions/warga.actions";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { cn, renderTemplate, getCategoryColor, formatFieldValuesForDocx } from "@/lib/utils";
import type { TemplateField } from "@/types";
import PDFOverlayPreview from "@/components/ui/PDFOverlayPreview";
import type { PDFOverlayField } from "@/lib/pdf-overlay";
import DocxViewerUrl from "@/components/ui/DocxViewerUrl";
import { useWarnIfUnsavedChanges } from "@/hooks/useWarnIfUnsavedChanges";
import ListEditor from "@/components/ui/ListEditor";
import TableEditor from "@/components/ui/TableEditor";

interface TemplateOption {
  id: string;
  name: string;
  description: string | null;
  category: string;
  fields: unknown;
  content: string;
  headerImageUrl?: string | null;
}

const STEPS = [
  { label: "Edit Kolom", icon: "" },
  { label: "Tinjau & Simpan", icon: "" }
];

type VerifyMessage = { type: "success" | "error"; text: string };

export default function EditCorrespondenceClient({ correspondence }: { correspondence: any }) {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);
  const selectedTemplate = correspondence.template as TemplateOption;

  const [title, setTitle] = useState(correspondence.title || "");
  const [nik, setNik] = useState(correspondence.nik || "");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>((correspondence.fieldValues as Record<string, string>) || {});
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(correspondence.uploadedFileUrl || null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(correspondence.uploadedFileName || null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isVerifyingNik, setIsVerifyingNik] = useState(false);
  const [nikVerifyMessage, setNikVerifyMessage] = useState<VerifyMessage | null>(null);

  const isDirty = !isSaved;
  useWarnIfUnsavedChanges(isDirty, "Anda memiliki perubahan yang belum disimpan. Apakah Anda yakin ingin keluar?");

  useEffect(() => {
    async function load() {
      const cats = await getCategories();
      setCategories(cats);
    }
    load();
  }, []);

  const handleFieldChange = (name: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleVerifyNik = async () => {
    const nikValue = nik;
    if (!nikValue) {
      setNikVerifyMessage({ type: "error", text: "NIK harus diisi" });
      return;
    }

    setIsVerifyingNik(true);
    setNikVerifyMessage(null);
    try {
      const res = await getWargaByNik(nikValue);
      if (res.success && res.data) {
        setNikVerifyMessage({ type: "success", text: "Data warga ditemukan! Kolom telah terisi otomatis." });
        const newValues = { ...fieldValues };

        fields.forEach((f) => {
          const fn = f.name.toLowerCase();
          const fl = f.label.toLowerCase();

          const isTempat = fn.includes("tempat") || fl.includes("tempat") || fl.includes("tmpt");
          const isTanggal = fn.includes("tanggal") || fl.includes("tanggal") || fl.includes("tgl");
          const isTTL = fn === "ttl" || fl === "ttl" || fl === "t.t.l";

          if (fn.includes("nik") || fl.includes("nik")) {
            newValues[f.name] = nikValue;
          } else if ((fn.includes("nama") || fl.includes("nama")) && !fn.includes("ibu") && !fn.includes("ayah")) {
            newValues[f.name] = res.data.nama_lgkp || newValues[f.name];
          } else if ((isTempat && isTanggal) || isTTL) {
            const tempat = res.data.tmpt_lhr || "";
            const tanggal = res.data.tgl_lhr || "";
            if (tempat && tanggal) {
              newValues[f.name] = `${tempat}, ${tanggal}`;
            } else {
              newValues[f.name] = tempat || tanggal || newValues[f.name];
            }
          } else if (isTempat) {
            newValues[f.name] = res.data.tmpt_lhr || newValues[f.name];
          } else if (isTanggal) {
            let dateVal = res.data.tgl_lhr;
            if (dateVal && dateVal.includes("-") && dateVal.split("-")[0].length === 2) {
              const parts = dateVal.split("-");
              if (parts.length === 3) dateVal = `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
            newValues[f.name] = dateVal || newValues[f.name];
          } else if (fn.includes("alamat") || fl.includes("alamat")) {
            newValues[f.name] = res.data.alamat || newValues[f.name];
          } else if ((fn.includes("rt") && fn.includes("rw")) || (fl.includes("rt") && fl.includes("rw"))) {
            if (res.data.no_rt && res.data.no_rw) {
              newValues[f.name] = `${res.data.no_rt} / ${res.data.no_rw}`;
            }
          } else if (fn === "rt" || fl === "rt" || fn.includes("rt") || fl.includes("rt")) {
            if (!fn.includes("sertifikat") && !fl.includes("sertifikat") && !fn.includes("peserta") && !fl.includes("peserta")) {
              newValues[f.name] = res.data.no_rt || newValues[f.name];
            }
          } else if (fn === "rw" || fl === "rw" || fn.includes("rw") || fl.includes("rw")) {
            if (!fn.includes("perwakilan") && !fl.includes("perwakilan")) {
              newValues[f.name] = res.data.no_rw || newValues[f.name];
            }
          } else if (fn.includes("pekerjaan") || fl.includes("pekerjaan")) {
            newValues[f.name] = res.data.jenis_pkrjn || newValues[f.name];
          } else if (fn.includes("agama") || fl.includes("agama")) {
            newValues[f.name] = res.data.agama || newValues[f.name];
          } else if (fn.includes("pendidikan") || fl.includes("pendidikan")) {
            newValues[f.name] = res.data.pddk_akh || newValues[f.name];
          } else if (fn.includes("status") || fl.includes("status") || fn.includes("kawin")) {
            newValues[f.name] = res.data.stat_kwn || newValues[f.name];
          } else if (fn.includes("jenis_kelamin") || fn.includes("kelamin") || fl.includes("kelamin")) {
            newValues[f.name] = res.data.jenis_klmin === "L" ? "Laki-laki" : res.data.jenis_klmin === "P" ? "Perempuan" : newValues[f.name];
          }
        });

        setFieldValues(newValues);
      } else {
        setNikVerifyMessage({ type: "error", text: res.error || "Data tidak ditemukan" });
      }
    } catch {
      setNikVerifyMessage({ type: "error", text: "Terjadi kesalahan saat verifikasi" });
    } finally {
      setIsVerifyingNik(false);
    }
  };

  const handleSubmit = async (asDraft: boolean = false) => {
    if (!title.trim()) {
      setError("Harap berikan judul untuk surat ini");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await updateCorrespondence(correspondence.id, {
        title,
        nik,
        fieldValues,
        uploadedFileUrl: uploadedFileUrl || undefined,
        uploadedFileName: uploadedFileName || undefined,
        status: asDraft ? "draft" : "submitted"
      });

      setIsSaved(true);
      router.push(`/correspondence/${correspondence.id}`);
      router.refresh();
    } catch {
      setError("Gagal mengupdate surat");
    } finally {
      setIsLoading(false);
    }
  };

  const fields = selectedTemplate ? Array.from(new Map((selectedTemplate.fields as unknown as TemplateField[]).map((f) => [f.name, f])).values()) : [];
  const renderedPreview = selectedTemplate ? renderTemplate(selectedTemplate.content, fieldValues, selectedTemplate.fields as any) : "";
  const formattedFieldValues = formatFieldValuesForDocx(fieldValues, selectedTemplate?.fields as any);
  const getCat = (val: string) => categories.find((c) => c.value === val);

  const canProceed = () => {
    if (step === 0) {
      return fields.every((f) => !f.required || (fieldValues[f.name] && fieldValues[f.name].trim()));
    }
    return true;
  };

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Step Progress */}
      <div className="flex items-center w-full max-w-2xl mx-auto">
        {STEPS.map((s, i) => (
          <div key={s.label} className={cn("flex items-center", i < STEPS.length - 1 ? "flex-1" : "")}>
            <button
              onClick={() => {
                if (i <= step || canProceed()) setStep(i);
              }}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap",
                i === step ? "bg-primary-600 text-white shadow-lg shadow-primary-500/25" : i < step ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" : "bg-slate-100 text-slate-500"
              )}>
              <span>{s.icon}</span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < STEPS.length - 1 && <div className={cn("flex-1 h-px mx-2 sm:mx-4", i <= step ? "bg-emerald-500/30" : "bg-slate-200")} />}
          </div>
        ))}
      </div>

      {/* Step 0: Fill Fields */}
      {step === 0 && (
        <div className="animate-fade-up">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form */}
            <div className="space-y-6">
              <Card glass>
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Judul Dokumen</h3>
                <Input label="Judul Surat" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="mis., Permohonan Anggaran ke Direktur Keuangan" required />
              </Card>

              <Card glass>
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Data Pemohon</h3>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Input label="NIK Pemohon" value={nik} onChange={(e) => setNik(e.target.value)} placeholder="Masukkan 16 digit NIK" required />
                  </div>
                  <Button type="button" variant="secondary" onClick={handleVerifyNik} disabled={isVerifyingNik || !nik} className="h-10 mb-0.5">
                    {isVerifyingNik ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      "Verifikasi"
                    )}
                  </Button>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  * Data NIK terintegrasi dengan database kependudukan desa Sumbermalang.
                </p>
                {nikVerifyMessage && <div className={cn("mt-4 p-3 rounded-lg text-sm border", nikVerifyMessage.type === "success" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20")}>{nikVerifyMessage.text}</div>}
              </Card>

              <Card glass>
                <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  Isi Kolom Template
                  <Badge className={getCat(selectedTemplate.category)?.color || getCategoryColor(selectedTemplate.category)}>{getCat(selectedTemplate.category)?.label || selectedTemplate.name}</Badge>
                </h3>
                <div className="space-y-4">
                  {fields.map((field) => {
                    return (
                      <div key={field.name} className="relative">
                        {field.type === "list_ordered" || field.type === "list_unordered" ? (
                          <ListEditor label={field.label} value={fieldValues[field.name] || ""} onChange={(val) => handleFieldChange(field.name, val)} placeholder={field.placeholder} />
                        ) : field.type === "table" ? (
                          <TableEditor label={field.label} value={fieldValues[field.name] || ""} onChange={(val) => handleFieldChange(field.name, val)} />
                        ) : field.type === "textarea" ? (
                          <Textarea label={field.label} value={fieldValues[field.name] || ""} onChange={(e) => handleFieldChange(field.name, e.target.value)} placeholder={field.placeholder} required={field.required} />
                        ) : (
                          <div className="flex gap-2 items-end">
                            <div className="flex-1">
                              <Input
                                label={field.label}
                                type={field.type === "date" ? "date" : field.type === "email" ? "email" : field.type === "number" ? "number" : "text"}
                                value={fieldValues[field.name] || ""}
                                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                placeholder={field.placeholder}
                                required={field.required}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Live Preview */}
            <div className="lg:sticky lg:top-6 self-start">
              <Card glass>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Pratinjau Langsung
                  </h3>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest">Pembaruan secara langsung</span>
                </div>

                {selectedTemplate?.content === "PDF_OVERLAY" ? (
                  <div className="bg-white rounded-xl overflow-hidden shadow-inner border border-slate-200" style={{ height: "600px" }}>
                    <PDFOverlayPreview fileUrl={selectedTemplate.headerImageUrl || ""} fields={selectedTemplate.fields as unknown as PDFOverlayField[]} fieldValues={formattedFieldValues} />
                  </div>
                ) : selectedTemplate?.content === "DOCX_OVERLAY" ? (
                  <div className="bg-white rounded-xl shadow-inner border border-slate-800" style={{ height: "600px" }}>
                    <DocxViewerUrl url={selectedTemplate.headerImageUrl || ""} fields={(fields as TemplateField[]).map((f) => ({ ...f, valueText: f.valueText || "" }))} fieldValues={formattedFieldValues} />
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-inner border border-slate-200 h-150 overflow-auto">
                    <div style={{ minWidth: "210mm", minHeight: "270mm", padding: "20mm" }}>
                      {selectedTemplate?.headerImageUrl && (
                        <div className="mb-6 flex justify-center">
                          <img src={selectedTemplate.headerImageUrl} alt="Letterhead" className="max-h-24 object-contain" />
                        </div>
                      )}
                      {renderedPreview.includes("<p>") || renderedPreview.includes("<table>") ? (
                        <div className="text-sm text-gray-900 font-serif leading-relaxed" dangerouslySetInnerHTML={{ __html: renderedPreview }} />
                      ) : (
                        <pre className="text-sm text-gray-900 whitespace-pre-wrap font-serif leading-relaxed">{renderedPreview}</pre>
                      )}
                    </div>
                  </div>
                )}
              </Card>

              {/* Uploaded file reference */}
              {uploadedFileName && (
                <Card glass className="mt-4">
                  <h3 className="text-xs font-semibold text-slate-900 mb-2">File Referensi</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    {uploadedFileName}
                  </div>
                </Card>
              )}
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="ghost" onClick={() => router.push(`/correspondence/${correspondence.id}`)}>
              Batal
            </Button>
            <Button onClick={() => setStep(1)} disabled={!canProceed()}>
              Tinjau
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
        </div>
      )}

      {/* Step 1: Review & Submit */}
      {step === 1 && (
        <div className="animate-fade-up max-w-3xl mx-auto">
          <Card glass>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Tinjau Perubahan</h3>
            <p className="text-sm text-slate-500 mb-6">Harap tinjau semuanya sebelum menyimpan perubahan.</p>

            {/* Summary */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between py-2 border-b border-slate-200">
                <span className="text-xs text-slate-500">Judul</span>
                <span className="text-sm text-slate-900 font-medium">{title}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-200">
                <span className="text-xs text-slate-500">Template</span>
                <Badge className={getCat(selectedTemplate.category)?.color || getCategoryColor(selectedTemplate.category)}>{getCat(selectedTemplate.category)?.label || selectedTemplate.name}</Badge>
              </div>
              {uploadedFileName && (
                <div className="flex items-center justify-between py-2 border-b border-slate-200">
                  <span className="text-xs text-slate-500">File Terlampir</span>
                  <span className="text-sm text-emerald-400">{uploadedFileName}</span>
                </div>
              )}
              <div className="flex items-center justify-between py-2 border-b border-slate-200">
                <span className="text-xs text-slate-500">Kolom Terisi</span>
                <span className="text-sm text-slate-600">
                  {Object.values(fieldValues).filter((v) => v.trim()).length} / {fields.length}
                </span>
              </div>
            </div>

            {/* Preview */}
            {selectedTemplate?.content === "PDF_OVERLAY" ? (
              <div className="bg-white rounded-xl mx-auto overflow-hidden shadow-inner border border-slate-200 mb-6 max-w-4xl" style={{ height: "600px" }}>
                <PDFOverlayPreview fileUrl={selectedTemplate.headerImageUrl || ""} fields={selectedTemplate.fields as unknown as PDFOverlayField[]} fieldValues={formattedFieldValues} />
              </div>
            ) : selectedTemplate?.content === "DOCX_OVERLAY" ? (
              <div className="bg-white rounded-xl mx-auto shadow-inner border border-slate-800 mb-6 max-w-4xl" style={{ height: "600px" }}>
                <DocxViewerUrl url={selectedTemplate.headerImageUrl || ""} fields={selectedTemplate.fields as unknown as { name: string; valueText: string }[]} fieldValues={formattedFieldValues} />
              </div>
            ) : (
              <div className="bg-white rounded-xl mx-auto shadow-lg border border-slate-200 mb-6 h-150 overflow-auto max-w-4xl">
                <div style={{ width: "max-content", minWidth: "210mm", minHeight: "270mm", padding: "20mm" }}>
                  {selectedTemplate?.headerImageUrl && (
                    <div className="mb-6 flex justify-center">
                      <img src={selectedTemplate.headerImageUrl} alt="Letterhead" className="max-h-24 object-contain" />
                    </div>
                  )}
                  {renderedPreview.includes("<p>") || renderedPreview.includes("<table>") ? (
                    <div className="text-sm text-gray-900 font-serif leading-relaxed" dangerouslySetInnerHTML={{ __html: renderedPreview }} />
                  ) : (
                    <pre className="text-sm text-gray-900 whitespace-pre-wrap font-serif leading-relaxed">{renderedPreview}</pre>
                  )}
                </div>
              </div>
            )}

            {error && (
              <p className="text-sm text-rose-400 mb-4 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="ghost" onClick={() => setStep(0)} className="sm:mr-auto">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Kembali
              </Button>
              {/* <Button variant="secondary" onClick={() => handleSubmit(true)} isLoading={isLoading}>
                Simpan sebagai Draf
              </Button> */}
              <Button onClick={() => handleSubmit(false)} isLoading={isLoading}>
                Simpan Perubahan
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
