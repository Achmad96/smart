"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getTemplates, getTemplateById } from "@/actions/template.actions";
import { getCategories } from "@/actions/category.actions";
import { createCorrespondence, getAutoFillData } from "@/actions/correspondence.actions";
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
import toast from "react-hot-toast";

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
  { label: "Pilih Template", icon: "" },
  { label: "Isi Kolom", icon: "" },
  { label: "Tinjau & Simpan", icon: "" }
];

type VerifyMessage = { type: "success" | "error"; text: string };

function NewCorrespondenceForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedTemplateId = searchParams.get("templateId");
  const stepParam = searchParams.get("step");

  const [step, setStepState] = useState(() => {
    if (stepParam === "isi-kolom") return 1;
    if (stepParam === "tinjau-simpan") return 2;
    return 0;
  });

  useEffect(() => {
    if (stepParam === "isi-kolom") setStepState(1);
    else if (stepParam === "tinjau-simpan") setStepState(2);
    else setStepState(0);
  }, [stepParam]);

  const setStep = useCallback((newStep: number) => {
    setStepState(newStep);
    let stepStr = "pilih-template";
    if (newStep === 1) stepStr = "isi-kolom";
    else if (newStep === 2) stepStr = "tinjau-simpan";
    
    const params = new URLSearchParams(searchParams.toString());
    params.set("step", stepStr);
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateOption | null>(null);
  const [title, setTitle] = useState("");
  const [nik, setNik] = useState("");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isVerifyingNik, setIsVerifyingNik] = useState(false);
  const [nikVerifyMessage, setNikVerifyMessage] = useState<VerifyMessage | null>(null);

  const isDirty = (selectedTemplate !== null || title.trim() !== "" || uploadedFile !== null) && !isSaved;
  useWarnIfUnsavedChanges(isDirty, "Anda memiliki surat yang belum disimpan. Apakah Anda yakin ingin keluar?");

  // Initialize fields
  const initializeFields = useCallback(async (templateId: string, fields: TemplateField[]) => {
    const initial: Record<string, string> = {};
    fields.forEach((f) => (initial[f.name] = ""));
    setFieldValues(initial);

    try {
      const autoFill = await getAutoFillData(templateId);
      if (Object.keys(autoFill).length > 0) {
        setFieldValues((prev) => ({ ...prev, ...autoFill }));
      }
    } catch (err) {
      console.error("Failed to fetch autofill data:", err);
    }
  }, []);

  // Load templates
  useEffect(() => {
    async function load() {
      setIsLoadingTemplates(true);
      const [t, cats] = await Promise.all([getTemplates(), getCategories()]);
      setTemplates(t.data as unknown as TemplateOption[]);
      setCategories(cats);

      // If preselected, auto-select
      if (preselectedTemplateId) {
        const selected = await getTemplateById(preselectedTemplateId);
        if (selected) {
          setSelectedTemplate(selected as unknown as TemplateOption);
          setTitle((selected as any).name);
          const fields = selected.fields as unknown as TemplateField[];
          const initial: Record<string, string> = {};
          fields.forEach((f) => (initial[f.name] = ""));

          try {
            const autoFill = await getAutoFillData(selected.id);
            Object.assign(initial, autoFill);
          } catch (e) {
            console.error(e);
          }

          setFieldValues(initial);
          setStep(1); // Jump to fill fields
        }
      }
      setIsLoadingTemplates(false);
    }
    load();
  }, [preselectedTemplateId]);

  const handleFileSelect = async (file: File) => {
    setUploadedFile(file);
    setUploadedFileName(file.name);
    setError(null);

    // Upload file immediately/
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "correspondences");

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) {
        setUploadedFileUrl(data.url);
      } else {
        setError(data.error || "Gagal mengunggah");
      }
    } catch {
      setError("Gagal mengunggah file");
    }
  };

  const handleSelectTemplate = (template: TemplateOption) => {
    setSelectedTemplate(template);
    setTitle(template.name);
    const fields = template.fields as unknown as TemplateField[];
    initializeFields(template.id, fields);
    setStep(1);
  };

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
            // Excel dates might need formatting, but let's assume it's string format 'DD-MM-YYYY' or similar.
            // If the input is type="date", we might need 'YYYY-MM-DD'.
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
            // Check strictly or loosely for RT
            if (!fn.includes("sertifikat") && !fl.includes("sertifikat") && !fn.includes("peserta") && !fl.includes("peserta")) {
              // avoid false positives like 'peserta' or 'sertifikat'
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
    if (!selectedTemplate) return;
    if (!title.trim()) {
      setError("Harap berikan judul untuk surat ini");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await createCorrespondence({
        title,
        templateId: selectedTemplate.id,
        nik,
        fieldValues,
        uploadedFileUrl: uploadedFileUrl || undefined,
        uploadedFileName: uploadedFileName || undefined,
        status: asDraft ? "draft" : "submitted"
      });

      setIsSaved(true);
      toast.success("Surat berhasil dibuat!");
      router.push("/correspondence");
      router.refresh();
    } catch {
      setError("Gagal membuat surat");
      toast.error("Gagal membuat surat");
      setIsLoading(false);
    }
  };

  const fields = selectedTemplate ? Array.from(new Map((selectedTemplate.fields as unknown as TemplateField[]).map((f) => [f.name, f])).values()) : [];

  const renderedPreview = selectedTemplate ? renderTemplate(selectedTemplate.content, fieldValues, selectedTemplate.fields as any) : "";
  const formattedFieldValues = formatFieldValuesForDocx(fieldValues, selectedTemplate?.fields as any);

  const getCat = (val: string) => categories.find((c) => c.value === val);

  const canProceed = () => {
    switch (step) {
      case 0:
        return selectedTemplate !== null;
      case 1:
        return fields.every((f) => !f.required || (fieldValues[f.name] && fieldValues[f.name].trim()));
      default:
        return true;
    }
  };

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Step Progress */}
      <div className="flex items-center w-full max-w-2xl mx-auto">
        {STEPS.map((s, i) => (
          <div key={s.label} className={cn("flex items-center", i !== STEPS.length - 1 ? "flex-1" : "")}>
            <button
              onClick={() => {
                if (i < step) setStep(i);
              }}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap",
                i === step ? "bg-primary-600 text-white shadow-lg shadow-primary-500/25" : i < step ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" : "bg-slate-100 text-slate-500"
              )}>
              <span>{s.icon}</span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i !== STEPS.length - 1 && <div className={cn("flex-1 h-px mx-2 sm:mx-4", i < step ? "bg-emerald-500/30" : "bg-slate-200")} />}
          </div>
        ))}
      </div>

      {/* Step 0: Choose Template */}
      {step === 0 && (
        <div className="animate-fade-up">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Pilih Template</h3>
            <p className="text-sm text-slate-500 mt-1">Pilih template yang sesuai dengan jenis surat Anda</p>
          </div>

          {isLoadingTemplates ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-48 rounded-2xl bg-slate-100 border border-slate-200 animate-shimmer" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
              {templates.map((template) => {
                const tFields = template.fields as unknown as TemplateField[];
                const isSelected = selectedTemplate?.id === template.id;
                return (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className={cn("text-left rounded-2xl border p-6 transition-all duration-300 cursor-pointer", isSelected ? "border-primary-500/50 bg-primary-500/10" : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50/80")}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
                        <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
                        </svg>
                      </div>
                      <Badge className={getCat(template.category)?.color || getCategoryColor(template.category)}>{getCat(template.category)?.label || template.category}</Badge>
                    </div>
                    <h4 className="text-sm font-semibold text-slate-900">{template.name}</h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{template.description}</p>
                    <p className="text-xs text-slate-600 mt-3">{tFields?.length || 0} kolom untuk diisi</p>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex justify-between mt-6">
            <Button variant="ghost" onClick={() => router.push("/correspondence")}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Kembali
            </Button>
          </div>
        </div>
      )}

      {/* Step 1: Fill Fields */}
      {step === 1 && selectedTemplate && (
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
                    <DocxViewerUrl url={selectedTemplate.headerImageUrl || ""} fields={(fields as any[]).map((f) => ({ ...f, valueText: f.valueText || "" }))} fieldValues={formattedFieldValues} />
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
            <Button variant="ghost" onClick={() => setStep(0)}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Kembali
            </Button>
            <Button onClick={() => setStep(2)} disabled={!canProceed()}>
              Tinjau
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Review & Submit */}
      {step === 2 && selectedTemplate && (
        <div className="animate-fade-up max-w-3xl mx-auto">
          <Card glass>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Tinjau Surat Anda</h3>
            <p className="text-sm text-slate-500 mb-6">Harap tinjau semuanya sebelum menyimpan surat.</p>

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
                <DocxViewerUrl url={selectedTemplate.headerImageUrl || ""} fields={selectedTemplate.fields as any} fieldValues={formattedFieldValues} />
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
              <Button variant="ghost" onClick={() => setStep(1)} className="sm:mr-auto">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Edit Kolom
              </Button>
              <Button onClick={() => handleSubmit(false)} isLoading={isLoading}>
                Simpan surat
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function NewCorrespondencePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-12">
          <div className="w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
        </div>
      }>
      <NewCorrespondenceForm />
    </Suspense>
  );
}
