"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getTemplates, getTemplateById } from "@/actions/template.actions";
import { getCategories } from "@/actions/category.actions";
import { createCorrespondence, getAutoFillData } from "@/actions/correspondence.actions";
import { getWargaByNik } from "@/actions/warga.actions";
import { cn, renderTemplate, formatFieldValuesForDocx } from "@/lib/utils";
import type { TemplateField } from "@/types";
import { useWarnIfUnsavedChanges } from "@/hooks/useWarnIfUnsavedChanges";
import toast from "react-hot-toast";

import type { TemplateOption, VerifyMessage } from "./types";
import TemplateSelectionStep from "./TemplateSelectionStep";
import FormFillingStep from "./FormFillingStep";
import ReviewStep from "./ReviewStep";

const STEPS = [
  { label: "Pilih Template", icon: "" },
  { label: "Isi Kolom", icon: "" },
  { label: "Tinjau & Simpan", icon: "" }
];

export default function NewCorrespondenceForm() {
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

  useEffect(() => {
    async function load() {
      setIsLoadingTemplates(true);
      const [t, cats] = await Promise.all([getTemplates(), getCategories()]);
      setTemplates(t.data as unknown as TemplateOption[]);
      setCategories(cats);

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
          setStep(1);
        }
      }
      setIsLoadingTemplates(false);
    }
    load();
  }, [preselectedTemplateId, initializeFields, setStep]);

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
        
        const fields = Array.from(new Map((selectedTemplate?.fields as unknown as TemplateField[] || []).map((f) => [f.name, f])).values());

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

      {step === 0 && (
        <TemplateSelectionStep
          templates={templates}
          categories={categories}
          isLoadingTemplates={isLoadingTemplates}
          selectedTemplate={selectedTemplate}
          onSelectTemplate={handleSelectTemplate}
        />
      )}

      {step === 1 && selectedTemplate && (
        <FormFillingStep
          selectedTemplate={selectedTemplate}
          title={title}
          setTitle={setTitle}
          nik={nik}
          setNik={setNik}
          fieldValues={fieldValues}
          handleFieldChange={handleFieldChange}
          isVerifyingNik={isVerifyingNik}
          nikVerifyMessage={nikVerifyMessage}
          handleVerifyNik={handleVerifyNik}
          categories={categories}
          formattedFieldValues={formattedFieldValues}
          renderedPreview={renderedPreview}
          uploadedFileName={uploadedFileName}
          canProceed={canProceed}
          onBack={() => setStep(0)}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && selectedTemplate && (
        <ReviewStep
          selectedTemplate={selectedTemplate}
          title={title}
          fieldValues={fieldValues}
          categories={categories}
          formattedFieldValues={formattedFieldValues}
          renderedPreview={renderedPreview}
          uploadedFileName={uploadedFileName}
          error={error}
          isLoading={isLoading}
          onBack={() => setStep(1)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
