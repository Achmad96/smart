"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath, unstable_cache } from "next/cache";
import type { TemplateField } from "@/types";
import { logActivity } from "./activity.actions";

export async function getTemplates(category?: string, options?: { page?: number; limit?: number; search?: string }) {
  const where: Record<string, unknown> = { isActive: true };
  if (category && category !== "all") where.category = category;
  
  if (options?.search) {
    where.OR = [
      { name: { contains: options.search } },
      { description: { contains: options.search } }
    ];
  }

  const page = options?.page || 1;
  const limit = options?.limit || 10;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.template.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
    prisma.template.count({ where }),
  ]);

  return {
    data,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

export const getTemplateById = unstable_cache(
  async (id: string) => {
    return prisma.template.findUnique({ where: { id } });
  },
  ["template-by-id"],
  { tags: ["templates"] }
);

export async function createTemplate(data: {
  name: string;
  description: string;
  category: string;
  fields: TemplateField[];
  content: string;
  headerImageUrl?: string;
}) {
  const template = await prisma.template.create({
    data: {
      name: data.name,
      description: data.description,
      category: data.category,
      fields: JSON.parse(JSON.stringify(data.fields)),
      content: data.content,
      headerImageUrl: data.headerImageUrl || null,
    },
  });
  
  await logActivity({
    action: "CREATE",
    entityType: "TEMPLATE",
    entityId: template.id,
    entityTitle: template.name,
    description: `Membuat template baru: ${template.name}`,
  });

  revalidatePath("/manage-templates");
  revalidatePath("/templates");
  return template;
}

export async function updateTemplate(
  id: string,
  data: {
    name?: string;
    description?: string;
    category?: string;
    fields?: TemplateField[];
    content?: string;
    isActive?: boolean;
  }
) {
  const updateData: Record<string, unknown> = Object.fromEntries(
    Object.entries(data)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, k === "fields" ? JSON.parse(JSON.stringify(v)) : v])
  );

  const template = await prisma.template.update({
    where: { id },
    data: updateData,
  });

  await logActivity({
    action: "UPDATE",
    entityType: "TEMPLATE",
    entityId: template.id,
    entityTitle: template.name,
    description: `Mengubah template: ${template.name}`,
  });

  revalidatePath("/manage-templates");
  revalidatePath("/templates");
  return template;
}

export async function deleteTemplate(id: string) {
  const template = await prisma.template.findUnique({ where: { id } });
  if (template) {
    await prisma.correspondence.deleteMany({ where: { templateId: id } });
    await prisma.template.delete({ where: { id } });
    
    await logActivity({
      action: "DELETE",
      entityType: "TEMPLATE",
      entityId: template.id,
      entityTitle: template.name,
      description: `Menghapus template: ${template.name}`,
    });
  }
  revalidatePath("/manage-templates");
  revalidatePath("/templates");
}

export async function getAllTemplates(options?: { page?: number; limit?: number; search?: string }) {
  const where: Record<string, unknown> = {};
  
  if (options?.search) {
    where.OR = [
      { name: { contains: options.search } },
      { description: { contains: options.search } }
    ];
  }

  const page = options?.page || 1;
  const limit = options?.limit || 10;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.template.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { correspondences: true } } },
      skip,
      take: limit,
    }),
    prisma.template.count({ where }),
  ]);

  return {
    data,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
