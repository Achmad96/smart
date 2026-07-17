"use client";

import { usePathname } from "next/navigation";

const getPageTitle = (pathname: string): { title: string; subtitle: string } => {
  if (pathname === "/") return { title: "Beranda", subtitle: "Ringkasan aktivitas surat menyurat Anda" };
  if (pathname === "/templates") return { title: "Template", subtitle: "Telusuri dan pilih template surat" };
  if (pathname === "/manage-templates/document-based") return { title: "Analisis Dokumen", subtitle: "Unggah surat untuk membuat template dan ekspor sebagai PDF" };
  if (pathname === "/manage-templates/manual") return { title: "Buat Template", subtitle: "Buat konfigurasi template baru" };
  if (pathname === "/templates/new-correspondence") return { title: "Surat Baru", subtitle: "Buat dokumen surat baru" };
  if (pathname === "/correspondence") return { title: "Surat Saya", subtitle: "Lacak dan kelola dokumen Anda" };
  if (pathname.startsWith("/correspondence/")) return { title: "Detail Surat", subtitle: "Lihat dan edit dokumen Anda" };
  if (pathname === "/manage-templates") return { title: "Kelola Template", subtitle: "Buat, edit, dan kelola template" };
  if (pathname.startsWith("/manage-templates/")) return { title: "Edit Template", subtitle: "Ubah konfigurasi template" };
  if (pathname === "/history") return { title: "Riwayat", subtitle: "Lihat riwayat surat Anda" };
  return { title: "SMART", subtitle: "Manajemen Surat Menyurat" };
};

export default function Header() {
  const pathname = usePathname();
  const { title, subtitle } = getPageTitle(pathname);

  return (
    <header className="mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{title}</h1>
          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
        </div>
      </div>
    </header>
  );
}
