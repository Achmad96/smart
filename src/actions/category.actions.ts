"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getCategories() {
  return prisma.category.findMany({
    orderBy: { label: "asc" },
  });
}

export async function createCategory(data: { value: string; label: string; color?: string }) {
  const result = await prisma.category.create({
    data,
  });
  revalidatePath("/manage-templates");
  revalidatePath("/manage-templates/categories");
  revalidatePath("/templates");
  revalidatePath("/templates/new-correspondence");
  return result;
}

export async function updateCategory(id: string, data: { value?: string; label?: string; color?: string }) {
  const result = await prisma.category.update({
    where: { id },
    data,
  });
  revalidatePath("/manage-templates");
  revalidatePath("/manage-templates/categories");
  revalidatePath("/templates");
  revalidatePath("/templates/new-correspondence");
  return result;
}

export async function deleteCategory(id: string) {
  await prisma.category.delete({
    where: { id },
  });
  revalidatePath("/manage-templates");
  revalidatePath("/manage-templates/categories");
  revalidatePath("/templates");
  revalidatePath("/templates/new-correspondence");
}

export async function seedDefaultCategories() {
  const CATEGORIES = [
    { value: "official", label: "Surat Resmi", color: "bg-primary-500/10 text-primary-400 border-primary-500/20" },
    { value: "internal", label: "Memo Internal", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
    { value: "invitation", label: "Undangan", color: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
    { value: "request", label: "Permintaan", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    { value: "notification", label: "Notifikasi", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    { value: "permit", label: "Izin / Otorisasi", color: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
  ];

  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { value: cat.value },
      update: {}, // don't override if exists
      create: cat,
    });
  }
}
