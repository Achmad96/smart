"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { renderTemplate } from "@/lib/utils";
import { logActivity } from "./activity.actions";

export async function createCorrespondence(data: {
  title: string;
  templateId: string;
  fieldValues: Record<string, string>;
  uploadedFileUrl?: string;
  uploadedFileName?: string;
  status?: string;
  nik?: string;
}) {
  const template = await prisma.template.findUnique({
    where: { id: data.templateId },
  });

  const renderedContent = template
    ? renderTemplate(template.content, data.fieldValues, template.fields as any)
    : null;

  const correspondence = await prisma.correspondence.create({
    data: {
      title: data.title,
      templateId: data.templateId,
      nik: data.nik || null,
      fieldValues: data.fieldValues,
      renderedContent,
      uploadedFileUrl: data.uploadedFileUrl || null,
      uploadedFileName: data.uploadedFileName || null,
      status: "final",
    },
  });

  await logActivity({
    action: "CREATE",
    entityType: "CORRESPONDENCE",
    entityId: correspondence.id,
    entityTitle: correspondence.title,
    description: `Membuat surat baru: ${correspondence.title}`,
  });

  revalidatePath("/correspondence");
  return correspondence;
}

export async function getCorrespondences(filters?: {
  status?: string;
  templateId?: string;
  page?: number;
  limit?: number;
  search?: string;
}) {
  const where: Record<string, unknown> = {};
  if (filters?.status && filters.status !== "all") where.status = filters.status;
  if (filters?.templateId) where.templateId = filters.templateId;
  
  if (filters?.search) {
    where.OR = [
      { title: { contains: filters.search } },
      { nik: { contains: filters.search } }
    ];
  }

  const page = filters?.page || 1;
  const limit = filters?.limit || 10;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.correspondence.findMany({
      where,
      include: { template: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.correspondence.count({ where }),
  ]);

  return {
    data,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getCorrespondenceById(id: string) {
  return prisma.correspondence.findUnique({
    where: { id },
    include: { template: true },
  });
}

async function reRenderContent(
  id: string,
  fieldValues: Record<string, string>
): Promise<string | undefined> {
  const correspondence = await prisma.correspondence.findUnique({
    where: { id },
    include: { template: true },
  });
  if (!correspondence?.template) return undefined;
  return renderTemplate(
    correspondence.template.content,
    fieldValues,
    correspondence.template.fields as any
  );
}

export async function updateCorrespondence(
  id: string,
  data: {
    title?: string;
    nik?: string;
    status?: string;
    fieldValues?: Record<string, string>;
    uploadedFileUrl?: string;
    uploadedFileName?: string;
  }
) {
  const renderedContent = data.fieldValues
    ? await reRenderContent(id, data.fieldValues)
    : undefined;

  const updateData = Object.fromEntries(
    Object.entries({ ...data, renderedContent }).filter(([, v]) => v !== undefined)
  );

  const result = await prisma.correspondence.update({
    where: { id },
    data: updateData,
  });

  await logActivity({
    action: "UPDATE",
    entityType: "CORRESPONDENCE",
    entityId: result.id,
    entityTitle: result.title,
    description: `Mengubah surat: ${result.title}`,
  });

  revalidatePath("/correspondence");
  revalidatePath(`/correspondence/${id}`);
  return result;
}

export async function deleteCorrespondence(id: string) {
  const correspondence = await prisma.correspondence.findUnique({ where: { id } });
  if (correspondence) {
    await prisma.correspondence.delete({ where: { id } });
    
    await logActivity({
      action: "DELETE",
      entityType: "CORRESPONDENCE",
      entityId: correspondence.id,
      entityTitle: correspondence.title,
      description: `Menghapus surat: ${correspondence.title}`,
    });
  }
  revalidatePath("/correspondence");
}

type FieldInfo = { name: string; label: string; type: string; placeholder?: string; valueText?: string; [key: string]: unknown };

function isDateField(f: FieldInfo): boolean {
  const name = f.name.toLowerCase();
  const label = f.label.toLowerCase();
  
  if (name.includes("lahir") || label.includes("lahir")) {
    return false;
  }
  
  return (
    f.type === "date" ||
    name.includes("date") ||
    label.includes("tanggal")
  );
}

function isNomorField(f: FieldInfo): boolean {
  const name = f.name.toLowerCase();
  const label = f.label.toLowerCase();
  return (
    name.includes("nomor") ||
    name.includes("number") ||
    label.includes("nomor") ||
    label.includes("no.")
  );
}

function incrementNomorSurat(lastValue: string): string {
  const parts = lastValue.split("/");

  if (parts.length >= 3) {
    const seqMatch = parts[1].match(/\d+/);
    if (seqMatch) {
      const newNum = (parseInt(seqMatch[0], 10) + 1).toString().padStart(seqMatch[0].length, "0");
      parts[1] = parts[1].replace(seqMatch[0], newNum);
    }
    const lastIdx = parts.length - 1;
    const yearMatch = parts[lastIdx].match(/\d{4}/);
    if (yearMatch) {
      parts[lastIdx] = parts[lastIdx].replace(yearMatch[0], new Date().getFullYear().toString());
    }
    return parts.join("/");
  }

  const matches = [...lastValue.matchAll(/\b\d+\b/g)];
  if (matches.length > 0) {
    const targetMatch =
      matches.find((m) => m[0].startsWith("0") && m[0].length > 1) ||
      matches.find((m) => m[0].length !== 4) ||
      matches[0];
    const newNum = (parseInt(targetMatch[0], 10) + 1).toString().padStart(targetMatch[0].length, "0");
    return lastValue.substring(0, targetMatch.index) + newNum + lastValue.substring(targetMatch.index! + targetMatch[0].length);
  }

  return lastValue + " - 001";
}

function autoFillDates(fields: FieldInfo[]): Record<string, string> {
  const result: Record<string, string> = {};
  const today = new Date().toISOString().split("T")[0];
  for (const f of fields.filter(isDateField)) {
    result[f.name] = today;
  }
  return result;
}

async function autoFillNomor(
  fields: FieldInfo[],
  templateId: string
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  const nomorFields = fields.filter(isNomorField);
  if (nomorFields.length === 0) return result;

  const lastCorrespondence = await prisma.correspondence.findFirst({
    where: { templateId },
    orderBy: { createdAt: "desc" },
  });

  const fieldValues = (lastCorrespondence?.fieldValues as Record<string, string>) ?? null;

  for (const f of nomorFields) {
    const lastValue = fieldValues?.[f.name];
    if (lastValue) {
      result[f.name] = incrementNomorSurat(lastValue);
    } else {
      const templateValue = f.valueText || f.placeholder;
      if (templateValue) {
        // Parse the value from the template (which was analyzed from the document)
        const parts = templateValue.split("/");
        if (parts.length >= 3) {
          const seqMatch = parts[1].match(/\d+/);
          if (seqMatch) {
            const padLen = seqMatch[0].length || 3;
            parts[1] = parts[1].trim().replace(seqMatch[0], "1".padStart(padLen, "0"));
          } else {
            parts[1] = "001";
          }
          const lastIdx = parts.length - 1;
          const yearMatch = parts[lastIdx].match(/\d{4}/);
          if (yearMatch) {
            parts[lastIdx] = parts[lastIdx].replace(yearMatch[0], new Date().getFullYear().toString());
          }
          result[f.name] = parts.join("/");
        } else {
          // If it doesn't match the standard format but we have a template value
          result[f.name] = incrementNomorSurat(templateValue);
        }
      } else {
        // Absolute fallback if no template value exists
        result[f.name] = `[archive code]/001/[agency code]/${new Date().getFullYear()}`;
      }
    }
  }
  return result;
}

export async function getAutoFillData(templateId: string) {
  const template = await prisma.template.findUnique({
    where: { id: templateId },
  });
  if (!template) return {};

  const fields = template.fields as FieldInfo[];

  return {
    ...autoFillDates(fields),
    ...(await autoFillNomor(fields, templateId)),
  };
}
