"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function logActivity(data: {
  action: "CREATE" | "UPDATE" | "DELETE";
  entityType: "CORRESPONDENCE" | "TEMPLATE";
  entityId: string;
  entityTitle: string;
  description: string;
}) {
  try {
    await prisma.activity.create({
      data: {
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        entityTitle: data.entityTitle,
        description: data.description,
      },
    });
    revalidatePath("/");
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}

export async function getRecentActivities(limit: number = 5) {
  try {
    return await prisma.activity.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  } catch (error) {
    console.error("Failed to fetch activities:", error);
    return [];
  }
}

export async function getAllActivities() {
  try {
    return await prisma.activity.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Failed to fetch all activities:", error);
    return [];
  }
}
