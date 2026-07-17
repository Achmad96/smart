"use server";

import fs from "fs/promises";
import path from "path";
import * as xlsx from "xlsx";

let cachedWargaData: Record<string, any>[] | null = null;
let lastModified: number = 0;

export async function getWargaByNik(nik: string) {
  try {
    const filePath = path.join(process.cwd(), "assets", "data_warga_sumbermalang.xls");
    
    const stats = await fs.stat(filePath);
    if (!cachedWargaData || stats.mtimeMs > lastModified) {
      const fileBuffer = await fs.readFile(filePath);
      const wb = xlsx.read(fileBuffer, { type: "buffer" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      cachedWargaData = xlsx.utils.sheet_to_json<Record<string, any>>(ws);
      lastModified = stats.mtimeMs;
    }

    const warga = cachedWargaData.find((row) => String(row.nik) === String(nik));

    if (warga) {
      return { success: true, data: JSON.parse(JSON.stringify(warga)) };
    }

    return { success: false, error: "Data warga tidak ditemukan" };
  } catch (error) {
    console.error("Error reading warga data:", error);
    return { success: false, error: "Terjadi kesalahan saat membaca data" };
  }
}
