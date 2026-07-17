"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";

const userLinks = [
  {
    href: "/",
    label: "Beranda",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )
  },
  {
    href: "/templates",
    label: "Surat Baru",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    )
  },
  {
    href: "/correspondence",
    label: "Surat Saya",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    )
  },
  {
    href: "/manage-templates",
    label: "Kelola Template",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  },
  {
    href: "/history",
    label: "Riwayat",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/manage-templates") {
      return pathname.startsWith("/manage-templates");
    }
    if (href === "/templates") {
      return pathname.startsWith("/templates");
    }
    if (href === "/history") {
      return pathname.startsWith("/history");
    }
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <>
      <div className="flex items-center gap-3 px-4 py-6">
        <div className="w-10 h-10 flex items-center justify-center shrink-0">
          <Image src="/logo.png" alt="SMART Logo" width={40} height={40} className="w-full h-full object-contain" />
        </div>
        {!collapsed && (
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">SMART</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Sumbermalang Administrasi Terpadu</p>
          </div>
        )}
      </div>

      <div className="px-3 mt-2">
        {!collapsed && <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 mb-2">Menu Utama</p>}
        <nav className="space-y-1">
          {userLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200", isActive(link.href) ? "bg-primary-500/10 text-primary-400 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100")}>
              <span className={cn("shrink-0", isActive(link.href) && "text-primary-400")}>{link.icon}</span>
              {!collapsed && <span>{link.label}</span>}
              {isActive(link.href) && !collapsed && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400" />}
            </Link>
          ))}
        </nav>
      </div>

      <div className="hidden lg:block mt-auto px-3 py-4">
        <button onClick={() => setCollapsed(!collapsed)} className="w-full flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs text-slate-500 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer">
          <svg className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
          {!collapsed && <span>Sembunyikan</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      <button onClick={() => setMobileOpen(true)} className="lg:hidden fixed top-4 left-4 z-50 rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {mobileOpen && <div className="lg:hidden fixed inset-0 z-40 bg-black/70" onClick={() => setMobileOpen(false)} />}

      <aside className={cn("lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col", "transition-transform duration-300", mobileOpen ? "translate-x-0" : "-translate-x-full")}>
        <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {sidebarContent}
      </aside>

      <aside className={cn("hidden lg:flex flex-col fixed inset-y-0 left-0 z-30", "bg-white border-r border-slate-200", "transition-all duration-300", collapsed ? "w-18" : "w-64")}>{sidebarContent}</aside>
    </>
  );
}
