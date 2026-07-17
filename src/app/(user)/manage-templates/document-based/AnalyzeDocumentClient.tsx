"use client";

import React, { useState, useCallback, useEffect } from "react";
import DocxViewer from "@/components/ui/DocxViewer";
import { useRouter, useSearchParams } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import FileUpload from "@/components/ui/FileUpload";
import { extractTextWithCoordinates, getFieldCoordinatesFromRange, fillPDFOverlay, generateHighlightPDF, checkIfPdfIsEncrypted, type ExtractedPDFData, type PDFOverlayField } from "@/lib/pdf-overlay";
import { createTemplate } from "@/actions/template.actions";
import { createCorrespondence } from "@/actions/correspondence.actions";
import { CATEGORIES, FIELD_TYPES } from "@/lib/constants";
import { useWarnIfUnsavedChanges } from "@/hooks/useWarnIfUnsavedChanges";
import ListEditor from "@/components/ui/ListEditor";
import TableEditor from "@/components/ui/TableEditor";
import { formatFieldValuesForDocx, buildSearchRegexStr } from "@/lib/utils";

type Step = "upload" | "mark" | "fill" | "preview";

interface MarkedField extends PDFOverlayField {
  valueText: string;
  startIndex: number;
  endIndex: number;
  occurrenceIndex?: number;
}

export default function AnalyzeDocumentClient({ categories }: { categories: any[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isTemplateMode = true;
  const step = (searchParams.get("step") as Step) || "upload";
  const setStep = useCallback(
    (newStep: Step) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("step", newStep);
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<"pdf" | "docx">("pdf");
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  // DOCX specific state
  const [docxArrayBuffer, setDocxArrayBuffer] = useState<ArrayBuffer | null>(null);

  // Field detection state
  const [extractedData, setExtractedData] = useState<ExtractedPDFData | null>(null);
  const [fields, setFields] = useState<MarkedField[]>([]);
  const [highlightPdfUrl, setHighlightPdfUrl] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");

  // Template save state
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templateCategory, setTemplateCategory] = useState(categories && categories.length > 0 ? categories[0].value : "official");

  // Fill state
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [correspondenceTitle, setCorrespondenceTitle] = useState("");
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);

  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  // NIK Fetch state
  const [isFetchingNik, setIsFetchingNik] = useState(false);

  // Warn on unsaved changes
  useWarnIfUnsavedChanges(file !== null && !isSaved, "Anda memiliki analisis dokumen yang belum disimpan. Apakah Anda yakin ingin keluar?");

  useEffect(() => {
    if (step !== "upload" && !file) {
      setStep("upload");
    }
  }, [step, file, setStep]);

  useEffect(() => {
    return () => {
      if (previewPdfUrl) URL.revokeObjectURL(previewPdfUrl);
      if (highlightPdfUrl) URL.revokeObjectURL(highlightPdfUrl);
    };
  }, [previewPdfUrl, highlightPdfUrl]);

  useEffect(() => {
    if (!file || fileType !== "pdf") return;
    let isMounted = true;

    generateHighlightPDF(file, fields).then((url) => {
      if (isMounted) {
        setHighlightPdfUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      } else {
        URL.revokeObjectURL(url);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [file, fields, fileType]);

  // Step 1: Upload and extract coordinates
  const handleFileSelect = useCallback(
    async (selectedFile: File) => {
      setFile(selectedFile);
      const isDocx = selectedFile.name.toLowerCase().endsWith(".docx") || selectedFile.name.toLowerCase().endsWith(".doc");
      setFileType(isDocx ? "docx" : "pdf");
      setExtractError(null);
      setIsProcessing(true);

      try {
        // Upload the file to the server for later use as the template base
        const formData = new FormData();
        formData.append("file", selectedFile);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          setUploadedFileUrl(uploadData.url);
        }

        const baseName = selectedFile.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
        setTemplateName(baseName);

        let data: ExtractedPDFData = { text: "", items: [], itemMap: [] };

        if (isDocx) {
          const arrayBuffer = await selectedFile.arrayBuffer();
          setDocxArrayBuffer(arrayBuffer);

          const mammoth = await import("mammoth");
          const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer.slice(0) });
          data = { text: result.value, items: [], itemMap: [] };
          setExtractedData(data);
        } else {
          const isEncrypted = await checkIfPdfIsEncrypted(selectedFile);
          if (isEncrypted) {
            setExtractError("PDF ini dienkripsi dan tidak dapat diproses oleh editor. Harap unggah versi yang tidak dienkripsi.");
            setIsProcessing(false);
            return;
          }

          // Extract text with exact coordinates
          data = await extractTextWithCoordinates(selectedFile);
          setExtractedData(data);
        }

        // Auto-detect fields based on common patterns
        const detectedFields: MarkedField[] = [];
        // 1. Detect standard known labels with any value
        const regexStandard = /(Nama|NIM|Tanggal|Hari|Waktu|Tempat|Perihal|Kepada|Nomor)[\s]*:[\s]*([^\n]+)/gi;
        let match;

        const isStandalone = (text: string, startIndex: number, length: number) => {
          const before = startIndex > 0 ? text[startIndex - 1] : " ";
          const after = startIndex + length < text.length ? text[startIndex + length] : " ";
          const isAlnum = (char: string) => /[a-zA-Z0-9]/.test(char);
          return !isAlnum(before) && !isAlnum(after);
        };

        while ((match = regexStandard.exec(data.text)) !== null) {
          const label = match[1].trim();
          const value = match[2].trim();

          // Skip if the value is mostly dots/ellipsis/underscores (will be handled by the dot detector below)
          if (/^(?:[.\u2026][\s]*){5,}$/.test(value) || /^(?:_[\s]*){5,}$/.test(value) || /^[.\u2026\s_]+$/.test(value)) continue;

          const name = label.toLowerCase().replace(/[^a-z0-9]/g, "_");

          const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const words = value.split(/\s+/);
          const searchRegexStr = words.map(escapeRegExp).join("\\s*");
          const searchRegex = new RegExp(searchRegexStr, "g");

          let searchMatch;
          while ((searchMatch = searchRegex.exec(data.text)) !== null) {
            const currentStartIndex = searchMatch.index;
            const currentEndIndex = currentStartIndex + searchMatch[0].length;

            if (isStandalone(data.text, currentStartIndex, searchMatch[0].length)) {
              const isAlreadyMarked = detectedFields.some((f) => (currentStartIndex >= f.startIndex && currentStartIndex < f.endIndex) || (currentEndIndex > f.startIndex && currentEndIndex <= f.endIndex));

              if (!isAlreadyMarked) {
                const coords = isDocx ? { pageIndex: 0, x: 0, y: 0, width: 100, height: 20, fontSize: 12, startY: 0, rects: [] } : getFieldCoordinatesFromRange(data, currentStartIndex, currentEndIndex);

                let occurrenceIndex = 0;
                const exactRegexStr = buildSearchRegexStr(value, true);
                if (exactRegexStr) {
                  const exactRegex = new RegExp(exactRegexStr, "g");
                  while (exactRegex.exec(data.text.substring(0, currentStartIndex)) !== null) {
                    occurrenceIndex++;
                  }
                }

                if (coords) {
                  detectedFields.push({
                    id: Math.random().toString(36).substring(2, 9),
                    name: name,
                    label: label,
                    type: "text",
                    required: true,
                    placeholder: label,
                    valueText: value,
                    occurrenceIndex,
                    startIndex: currentStartIndex,
                    endIndex: currentEndIndex,
                    ...coords
                  });
                }
              }
            }
          }
        }

        // 2. Detect ANY dotted lines / ellipsis / underscores as editable fields
        const emptyFieldRegex = /((?:[.\u2026][\t \r\n]*){5,}|(?:\u2026[\t \r\n]*)+|(?:_[\t \r\n]*){5,})/g;
        let emptyMatch;

        while ((emptyMatch = emptyFieldRegex.exec(data.text)) !== null) {
          const valueFull = emptyMatch[1];
          const value = valueFull.trimEnd();
          const currentStartIndex = emptyMatch.index;
          const currentEndIndex = currentStartIndex + value.length;

          // Extract label from the text before the dots (can be separated by newlines in DOCX tables)
          const textBefore = data.text.substring(0, currentStartIndex);
          const tail = textBefore.substring(Math.max(0, textBefore.length - 150));

          // Look for a label before the colon or right before the dots
          const labelMatch = tail.match(/([A-Za-z][A-Za-z0-9_/, -]*)[\s]*:?[\s]*$/);
          let label = "Kolom";
          if (labelMatch && labelMatch[1].trim()) {
            label = labelMatch[1].trim();
            if (label.length > 40) label = label.substring(label.length - 40).trim();
          } else {
            label = `Kolom ${detectedFields.length + 1}`;
          }

          const name = "field_" + currentStartIndex;

          const isAlreadyMarked = detectedFields.some((f) => (currentStartIndex >= f.startIndex && currentStartIndex < f.endIndex) || (currentEndIndex > f.startIndex && currentEndIndex <= f.endIndex));

          if (!isAlreadyMarked) {
            const coords = isDocx ? { pageIndex: 0, x: 0, y: 0, width: 100, height: 20, fontSize: 12, startY: 0, rects: [] } : getFieldCoordinatesFromRange(data, currentStartIndex, currentEndIndex);
            if (coords) {
              detectedFields.push({
                id: Math.random().toString(36).substring(2, 9),
                name: name,
                label: label,
                type: "text",
                required: true,
                placeholder: "Isi kolom",
                valueText: value,
                startIndex: currentStartIndex,
                endIndex: currentEndIndex,
                ...coords
              });
            }
          }
        }

        setFields(detectedFields.sort((a, b) => a.startIndex - b.startIndex));
        setStep("mark");
      } catch (err: unknown) {
        setExtractError(err instanceof Error ? err.message : "Gagal memproses dokumen");
      } finally {
        setIsProcessing(false);
      }
    },
    [setStep]
  );

  const handleSearchText = useCallback(
    (textArg?: string, occurrenceIndex?: number) => {
      const targetText = typeof textArg === "string" ? textArg : searchText;
      const textToFind = targetText.trim();

      if (fileType === "docx") {
        if (!textToFind) {
          setExtractError("Harap masukkan teks untuk dicari");
          return;
        }

        let finalOccurrenceIndex = occurrenceIndex;

        // If occurrenceIndex was not provided (e.g. from search box or clipboard fallback),
        // find the first occurrenceIndex that isn't already marked for this regex!
        if (finalOccurrenceIndex === undefined) {
          const regexStr = buildSearchRegexStr(textToFind, true);
          if (regexStr) {
            const existingIndices = fields.filter((f) => buildSearchRegexStr(f.valueText || "", true) === regexStr).map((f) => f.occurrenceIndex || 0);

            let attempt = 0;
            while (existingIndices.includes(attempt)) {
              attempt++;
            }
            finalOccurrenceIndex = attempt;
          } else {
            finalOccurrenceIndex = 0;
          }
        }

        const newField: MarkedField = {
          id: crypto.randomUUID(),
          name: `field_${fields.length + 1}`,
          label: textToFind.length > 20 ? textToFind.substring(0, 20) + "..." : textToFind,
          valueText: textToFind,
          startIndex: 0,
          endIndex: 0,
          pageIndex: 0,
          x: 0,
          y: 0,
          width: 100,
          height: 20,
          type: "text",
          required: true,
          placeholder: "Masukkan kolom",
          fontSize: 12,
          occurrenceIndex: finalOccurrenceIndex
        };

        setFields([...fields, newField]);
        setSearchText("");
        return;
      }

      if (!textToFind || !extractedData) return;

      const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const words = textToFind.split(/\s+/);
      const searchRegexStr = words.map(escapeRegExp).join("\\s*");
      const searchRegex = new RegExp(searchRegexStr, "g");

      const unmarkedMatches: { startIndex: number; endIndex: number }[] = [];

      let searchMatch;
      // Check for all occurrences of the text that aren't already marked
      while ((searchMatch = searchRegex.exec(extractedData.text)) !== null) {
        const currentStartIndex = searchMatch.index;
        const currentEndIndex = currentStartIndex + searchMatch[0].length;

        const isAlreadyMarked = fields.some((f) => (currentStartIndex >= f.startIndex && currentStartIndex < f.endIndex) || (currentEndIndex > f.startIndex && currentEndIndex <= f.endIndex));

        if (!isAlreadyMarked) {
          unmarkedMatches.push({ startIndex: currentStartIndex, endIndex: currentEndIndex });
        }
      }

      if (unmarkedMatches.length === 0) {
        alert(`Tidak dapat menemukan teks yang belum ditandai: "${textToFind}"`);
        return;
      }

      // Use the first unmarked occurrence to determine the label and name
      const firstStartIndex = unmarkedMatches[0].startIndex;
      let label = textToFind;
      let name = textToFind.toLowerCase().replace(/[^a-z0-9]/g, "_");

      // Look for words before the selected text
      const textBefore = extractedData.text.substring(0, firstStartIndex);
      const tail = textBefore.substring(Math.max(0, textBefore.length - 150));

      // Extract words from the text before the selection (allowing newlines from DOCX tables)
      const beforeMatch = tail.match(/([A-Za-z0-9_/-]+(?:[\s]+[A-Za-z0-9_/-]+){0,3})[\s]*:?[\s]*$/);
      if (beforeMatch && beforeMatch[1]) {
        label = beforeMatch[1];
        name = label.toLowerCase().replace(/[^a-z0-9]/g, "_");
      }

      const newFields: MarkedField[] = [];

      for (const match of unmarkedMatches) {
        const { startIndex, endIndex } = match;
        let coords = null;

        if (fileType === "pdf") {
          coords = getFieldCoordinatesFromRange(extractedData, startIndex, endIndex);
          if (!coords) continue;
        }

        newFields.push({
          id: Math.random().toString(36).substring(2, 9),
          name: name,
          label: label,
          type: "text",
          required: true,
          placeholder: textToFind,
          valueText: textToFind,
          startIndex,
          endIndex,
          ...(coords || { pageIndex: 0, x: 0, y: 0, width: 0, height: 0, fontSize: 12, startY: 0, rects: [] })
        });
      }

      if (newFields.length === 0) {
        alert(fileType === "pdf" ? "Tidak dapat menghitung koordinat untuk teks ini." : "Tidak dapat menambahkan kolom.");
        return;
      }

      setFields((prev) => [...prev, ...newFields].sort((a, b) => a.startIndex - b.startIndex));
      if (typeof textArg !== "string") {
        setSearchText("");
      }
    },
    [fields, fileType, extractedData, searchText]
  );

  const handleAddSelectedText = useCallback(async () => {
    const selection = window.getSelection();
    let text = selection?.toString();
    let occurrenceIndex: number | undefined = undefined;

    if (!text || !text.trim()) {
      try {
        text = await navigator.clipboard.readText();
      } catch (err) {
        console.error("Failed to read clipboard:", err);
      }
    } else if (fileType === "docx" && selection && selection.rangeCount > 0) {
      try {
        const range = selection.getRangeAt(0);
        const container = document.querySelector(".docx-preview-container");
        if (container && container.contains(range.commonAncestorContainer)) {
          const treeWalker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
          let currentNode: Node | null;
          let textBefore = "";

          while ((currentNode = treeWalker.nextNode())) {
            if (currentNode === range.startContainer) {
              textBefore += (currentNode.nodeValue || "").substring(0, range.startOffset);
              break;
            }
            textBefore += currentNode.nodeValue || "";
          }

          const regexStr = buildSearchRegexStr(text.trim(), true);
          if (regexStr) {
            const regex = new RegExp(regexStr, "g");
            let count = 0;
            while (regex.exec(textBefore) !== null) {
              count++;
            }
            occurrenceIndex = count;
          }
        }
      } catch (e) {
        console.error("Failed to calculate occurrence index", e);
      }
    }

    if (text && text.trim()) {
      handleSearchText(text.trim(), occurrenceIndex);
    } else {
      alert("Harap salin teks dari dokumen terlebih dahulu (Ctrl+C), atau ketik di kotak pencarian.");
    }
  }, [handleSearchText, fileType]);

  const removeField = useCallback((fieldId: string) => {
    setFields((prev) => prev.filter((f) => f.id !== fieldId));
  }, []);

  const renameField = useCallback((fieldId: string, currentLabel: string) => {
    const newLabel = window.prompt("Masukkan label baru untuk kolom ini:", currentLabel);
    if (newLabel && newLabel.trim() !== "" && newLabel !== currentLabel) {
      setFields((prev) =>
        prev.map((f) => {
          if (f.id === fieldId) {
            return {
              ...f,
              label: newLabel.trim(),
              name:
                newLabel
                  .trim()
                  .toLowerCase()
                  .replace(/[^a-z0-9]/g, "_") + `_${Date.now().toString().slice(-4)}`
            };
          }
          return f;
        })
      );
    }
  }, []);

  const changeFieldType = useCallback((fieldId: string, newType: string) => {
    setFields((prev) => prev.map((f) => (f.id === fieldId ? { ...f, type: newType } : f)));
  }, []);

  const proceedToFill = useCallback(() => {
    const initialValues: Record<string, string> = {};
    fields.forEach((f) => {
      const isDotsOnly = /^(?:[.\u2026][\s]*){3,}$/.test(f.valueText.trim()) || /^(?:_[\s]*){3,}$/.test(f.valueText.trim()) || /^[.\u2026\s_]+$/.test(f.valueText.trim());
      initialValues[f.name] = isDotsOnly ? "" : f.valueText;
    });
    setFieldValues(initialValues);
    setStep("fill");
  }, [fields, setStep]);

  const handleFetchNik = useCallback(
    async (nikField: string) => {
      const nikValue = fieldValues[nikField];
      if (!nikValue || nikValue.trim() === "") {
        alert("Harap isi NIK terlebih dahulu");
        return;
      }

      setIsFetchingNik(true);
      try {
        const { getWargaByNik } = await import("@/actions/warga.actions");
        const result = await getWargaByNik(nikValue.trim());

        if (result.success && result.data) {
          const data = result.data;
          const newValues = { ...fieldValues };

          fields.forEach((f) => {
            const label = f.label.toLowerCase();
            if (label === "nik" || f.name === nikField) return; // Skip NIK itself

            if (label.includes("nama") && data.nama_lgkp) {
              newValues[f.name] = data.nama_lgkp;
            } else if ((label.includes("tempat, tanggal lahir") || label.includes("ttl")) && data.tmpt_lhr && data.tgl_lhr) {
              newValues[f.name] = `${data.tmpt_lhr}, ${data.tgl_lhr}`;
            } else if (label.includes("tempat lahir") && data.tmpt_lhr) {
              newValues[f.name] = data.tmpt_lhr;
            } else if (label.includes("tanggal lahir") && data.tgl_lhr) {
              newValues[f.name] = data.tgl_lhr;
            } else if (label.includes("jenis kelamin") && data.jenis_klmin) {
              newValues[f.name] = data.jenis_klmin;
            } else if (label.includes("agama") && data.agama) {
              newValues[f.name] = data.agama;
            } else if (label.includes("pekerjaan") && data.jenis_pkrjn) {
              newValues[f.name] = data.jenis_pkrjn;
            } else if (label.includes("alamat")) {
              const rtrw = data.no_rt && data.no_rw ? `RT ${data.no_rt} RW ${data.no_rw}` : "";
              const alamat = data.alamat ? data.alamat : "";

              if (f.valueText.includes("RT") && f.valueText.includes("RW") && data.no_rt && data.no_rw) {
                // Try to replace dots for RT and RW
                let val = f.valueText;
                val = val.replace(/\.{3,}/, data.no_rt);
                val = val.replace(/\.{3,}/, data.no_rw);
                newValues[f.name] = val;
              } else {
                newValues[f.name] = `${alamat} ${rtrw}`.trim();
              }
            } else if (label.includes("rt") && label.includes("rw") && data.no_rt && data.no_rw) {
              newValues[f.name] = `${data.no_rt} / ${data.no_rw}`;
            } else if (label === "rt" && data.no_rt) {
              newValues[f.name] = data.no_rt;
            } else if (label === "rw" && data.no_rw) {
              newValues[f.name] = data.no_rw;
            }
          });

          setFieldValues(newValues);
          alert("Data berhasil ditarik dan diisi otomatis");
        } else {
          alert(result.error || "Data warga tidak ditemukan");
        }
      } catch (err) {
        console.error("Error fetching NIK:", err);
        alert("Terjadi kesalahan saat menarik data NIK");
      } finally {
        setIsFetchingNik(false);
      }
    },
    [fieldValues, fields]
  );

  const proceedToPreview = useCallback(async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      if (fileType === "pdf") {
        const url = await fillPDFOverlay(file, fields, fieldValues);
        if (previewPdfUrl) URL.revokeObjectURL(previewPdfUrl);
        setPreviewPdfUrl(url);
      }
      if (fileType === "docx") {
        setStep("preview");
        setIsProcessing(false);
        return;
      }
      setStep("preview");
    } catch (error: unknown) {
      console.error("Error generating preview:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      alert(`Gagal membuat pratinjau: ${errorMessage}`);
      setExtractError(`Gagal membuat pratinjau: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  }, [file, fileType, fields, fieldValues, previewPdfUrl, setStep]);

  const prepareTemplateFields = () => {
    return fields.map((f) => ({
      name: f.name,
      label: f.label,
      valueText: f.valueText,
      type: (f.type || "text") as any,
      required: true,
      placeholder: `Enter ${f.label.toLowerCase()}`,
      occurrenceIndex: (f as MarkedField).occurrenceIndex,
      coords: {
        pageIndex: f.pageIndex,
        x: f.x,
        y: f.y,
        width: f.width,
        height: f.height,
        fontSize: f.fontSize,
        startY: f.startY,
        rects: f.rects
      }
    }));
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      setSaveError("Nama template diperlukan");
      return;
    }
    if (!uploadedFileUrl) {
      setSaveError("Gagal mengunggah file. Silakan coba lagi.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    const templateContent = fileType === "docx" ? "DOCX_OVERLAY" : "PDF_OVERLAY";

    try {
      await createTemplate({
        name: templateName,
        description: templateDescription || `Template dibuat dari dokumen yang diunggah`,
        category: templateCategory,
        fields: prepareTemplateFields(),
        content: templateContent,
        headerImageUrl: uploadedFileUrl
      });

      setIsSaved(true);
      if (isTemplateMode) {
        router.push("/manage-templates");
      } else {
        router.push("/templates");
      }
      router.refresh();
    } catch {
      setSaveError("Gagal menyimpan templat. Silakan coba lagi.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCorrespondence = async () => {
    if (!correspondenceTitle.trim()) {
      setSaveError("Judul dokumen diperlukan");
      return;
    }
    if (!templateName.trim()) {
      setSaveError("Nama template diperlukan");
      return;
    }
    if (!uploadedFileUrl) {
      setSaveError("Gagal mengunggah file. Silakan coba lagi.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    const templateContent = fileType === "docx" ? "DOCX_OVERLAY" : "PDF_OVERLAY";

    try {
      const template = await createTemplate({
        name: templateName,
        description: templateDescription || `Template created from uploaded document`,
        category: templateCategory,
        fields: prepareTemplateFields(),
        content: templateContent,
        headerImageUrl: uploadedFileUrl
      });

      await createCorrespondence({
        title: correspondenceTitle,
        templateId: template.id,
        fieldValues,
        uploadedFileUrl: uploadedFileUrl,
        uploadedFileName: file?.name || undefined,
        status: "submitted"
      });

      setIsSaved(true);
      router.push("/correspondence");
      router.refresh();
    } catch {
      setSaveError("Gagal menyimpan. Silakan coba lagi.");
    } finally {
      setIsSaving(false);
    }
  };

  const stepsMeta: { key: Step; label: string; num: number }[] = [
    { key: "upload", label: "Unggah", num: 1 },
    { key: "mark", label: "Tandai Kolom", num: 2 }
  ];

  const stepOrder: Step[] = ["upload", "mark"];
  const currentStepIndex = stepOrder.indexOf(step);

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="no-print flex items-center gap-1 p-1 rounded-2xl bg-white/3 border border-slate-200">
        {stepsMeta.map((s, i) => (
          <React.Fragment key={s.key}>
            <button
              onClick={() => {
                if (stepOrder.indexOf(s.key) <= currentStepIndex) setStep(s.key);
              }}
              disabled={stepOrder.indexOf(s.key) > currentStepIndex}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer flex-1 justify-center
                ${step === s.key ? "bg-primary-500/15 text-primary-400 border border-primary-500/30" : stepOrder.indexOf(s.key) < currentStepIndex ? "text-emerald-400 hover:bg-slate-100" : "text-slate-600 cursor-not-allowed"}`}>
              <span
                className={`flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-bold
                ${step === s.key ? "bg-primary-500/20 text-primary-400" : stepOrder.indexOf(s.key) < currentStepIndex ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-100 text-slate-600"}`}>
                {stepOrder.indexOf(s.key) < currentStepIndex ? "✓" : s.num}
              </span>
              <span className="hidden md:inline">{s.label}</span>
            </button>
            {i < stepsMeta.length - 1 && <div className={`w-4 h-px shrink-0 ${i < currentStepIndex ? "bg-emerald-500/30" : "bg-slate-100"}`} />}
          </React.Fragment>
        ))}
      </div>

      {step === "upload" && (
        <Card glass>
          <h3 className="text-sm font-semibold text-slate-900 mb-1">Unggah Dokumen</h3>
          <p className="text-xs text-slate-500 mb-5">
            Unggah dokumen mentah (PDF, DOC, atau DOCX). Direkomendasikan menggunakan dokumen <strong>DOCX</strong>, karena lebih mudah untuk dianalisis dan diperbarui.
          </p>

          <FileUpload onFileSelect={handleFileSelect} accept=".pdf,.doc,.docx" maxSize={15 * 1024 * 1024} />

          {isProcessing && (
            <div className="mt-6 flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-600">Menganalisis dokumen...</p>
            </div>
          )}

          {extractError && (
            <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <p className="text-sm text-rose-400">{extractError}</p>
            </div>
          )}
        </Card>
      )}

      {step === "mark" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 space-y-4">
              <Card glass>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Tandai Kolom yang Dapat Diedit</h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 p-3 rounded-xl bg-white/2 border border-slate-200">
                  <Input label="Nama Template" value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="mis., Dokumen Templat" required />
                  <Select label="Kategori" value={templateCategory} onChange={(e) => setTemplateCategory(e.target.value)} options={categories} />
                </div>

                <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden" style={{ height: "600px" }}>
                  {fileType === "pdf" ? (
                    highlightPdfUrl ? (
                      <iframe src={`${highlightPdfUrl}#toolbar=0`} className="w-full h-full" title="PDF Preview" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500">Memuat pratinjau...</div>
                    )
                  ) : (
                    fileType === "docx" &&
                    docxArrayBuffer && (
                      <div className="bg-white rounded-xl shadow-inner border border-slate-800" style={{ height: "600px" }}>
                        <DocxViewer arrayBuffer={docxArrayBuffer} fields={fields} fieldValues={fieldValues} highlightUnfilled={false} />
                      </div>
                    )
                  )}
                </div>
              </Card>

              <Card glass className="border-primary-500/30 bg-primary-500/5">
                <h4 className="text-sm font-semibold text-slate-900 mb-3">Tambahkan Kolom Baru</h4>
                <div className="flex gap-3">
                  <Input
                    placeholder="Cari teks untuk ditandai"
                    className="flex-1"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSearchText();
                      }
                    }}
                  />
                  <Button size="sm" onClick={() => handleSearchText()}>
                    Cari & Tandai
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onMouseDown={(e) => {
                      e.preventDefault(); // Prevent losing text selection focus
                      handleAddSelectedText();
                    }}
                    title="Salin teks dari dokumen (Ctrl+C) dan klik di sini untuk menempel & menandainya">
                    Tempel & Tambah Kolom
                  </Button>
                </div>
              </Card>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <Card glass>
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">🏷️ Kolom Overlay ({fields.length})</h3>
                {fields.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-slate-500">Tidak ada kolom yang terdeteksi atau ditandai.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-125 overflow-y-auto pr-1">
                    {fields.map((field) => (
                      <div key={field.id} className="flex items-start justify-between p-2.5 rounded-lg bg-white/2 border border-slate-200 group">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-primary-400">{field.label}</span>
                            <button onClick={() => renameField(field.id, field.label)} className="p-1 rounded text-slate-500 hover:text-primary-400 hover:bg-primary-500/10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer" title="Ubah nama label kolom">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                          </div>
                          <div className="mt-1">
                            <select
                              value={field.type}
                              onChange={(e) => changeFieldType(field.id, e.target.value)}
                              className="text-[10px] bg-slate-50/80 border border-slate-200 rounded-md px-1.5 py-0.5 text-slate-600 cursor-pointer hover:border-primary-500/30 focus:border-primary-500/50 focus:outline-none transition-colors">
                              {FIELD_TYPES.map((ft) => (
                                <option key={ft.value} value={ft.value}>
                                  {ft.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 truncate max-w-full" title={field.valueText}>
                            {field.valueText.length > 50 ? field.valueText.substring(0, 50) + "…" : field.valueText}
                          </p>
                        </div>
                        <button onClick={() => removeField(field.id)} className="p-1 rounded text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>

          <div className="flex gap-3 items-center no-print">
            <Button variant="secondary" onClick={() => setStep("upload")}>
              Kembali
            </Button>

            <Button onClick={handleSaveTemplate} isLoading={isSaving}>
              Simpan sebagai Template
            </Button>
            {saveError && <span className="text-sm text-rose-500 ml-2">{saveError}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
