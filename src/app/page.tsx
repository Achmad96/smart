import Link from "next/link";
import { getCorrespondences } from "@/actions/correspondence.actions";
import { getTemplates } from "@/actions/template.actions";
import { getRecentActivities } from "@/actions/activity.actions";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { formatDateTime, getCategoryColor } from "@/lib/utils";
import type { TemplateField } from "@/types";

export const dynamic = "force-dynamic";

const STATS_CONFIG = [
  {
    key: "correspondences",
    label: "Total Surat",
    icon: (
      <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  },
  {
    key: "templates",
    label: "Total Template",
    icon: (
      <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    )
  }
] as const;

export default async function HomePage() {
  const correspondences = await getCorrespondences();
  const templates = await getTemplates();

  const statValues: Record<string, number> = {
    correspondences: correspondences.total,
    templates: templates.total
  };
  const recentActivity = await getRecentActivities(5);

  return (
    <div className="space-y-8 animate-fade-up">
      <div className="relative rounded-2xl border border-slate-200 overflow-hidden p-8 sm:p-10 bg-cover bg-center" style={{ backgroundImage: 'url("/hero-bg.png")' }}>
        {/* Dark overlay for contrast */}
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] pointer-events-none"></div>

        {/* Background glow effects */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-primary-500/30 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/20 border border-primary-500/30 text-primary-200 text-xs font-semibold tracking-wide mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            PEMERINTAH DESA SUMBERMALANG
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Selamat datang di <span className="text-transparent bg-clip-text bg-linear-to-r from-primary-400 to-primary-300">SMART</span>
          </h2>
          <h3 className="text-lg sm:text-xl font-medium text-slate-200 mt-2">Sumbermalang Administrasi Terpadu</h3>
          <p className="text-slate-300 mt-4 max-w-2xl text-sm sm:text-base leading-relaxed">Sistem digitalisasi persuratan resmi dan pelayanan publik satu pintu. Mewujudkan tata kelola administrasi Desa Sumbermalang yang cepat, efisien, transparan, dan terintegrasi untuk melayani masyarakat.</p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link href="/templates/new-correspondence" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-all hover:shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)] active:scale-[0.98]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Buat Surat Baru
            </Link>
            <Link href="/manage-templates" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium border border-slate-200 hover:border-slate-300 transition-all active:scale-[0.98]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Kelola Template
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {STATS_CONFIG.map((stat) => (
          <Card key={stat.key} glass className="text-center py-4">
            <div className="mb-2 flex justify-center">{stat.icon}</div>
            <p className="text-2xl font-bold text-slate-900">{statValues[stat.key]}</p>
            <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
          </Card>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Template Tersedia</h2>
            <p className="text-xs text-slate-500 mt-0.5">Pilih template untuk memulai</p>
          </div>
          <Link href="/templates" className="text-xs font-medium text-primary-400 hover:text-primary-300 transition-colors">
            Lihat semua →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {templates.data.slice(0, 6).map((template) => {
            const fields = template.fields as unknown as TemplateField[];
            return (
              <Link key={template.id} href={`/templates/new-correspondence?templateId=${template.id}`} className="group">
                <Card hover glass className="h-full">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center group-hover:bg-primary-500/20 transition-colors">
                      <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
                      </svg>
                    </div>
                    <Badge className={getCategoryColor(template.category)}>{template.category}</Badge>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 group-hover:text-primary-300 transition-colors">{template.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{template.description}</p>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200">
                    <span className="text-xs text-slate-500">{fields?.length || 0} kolom</span>
                    <span className="text-xs text-primary-400 ml-auto group-hover:translate-x-0.5 transition-transform">Gunakan →</span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {recentActivity.length > 0 && (
        <Card glass>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Aktivitas Terbaru</h2>
            <Link href="/history" className="text-xs font-medium text-primary-400 hover:text-primary-300 transition-colors">
              Lihat semua →
            </Link>
          </div>
          <div className="space-y-2">
            {recentActivity.map((item) => {
              const isDelete = item.action === "DELETE";
              const href = item.entityType === "TEMPLATE" ? `/templates` : `/correspondence/${item.entityId}`;

              const content = (
                <div className="flex items-center gap-3 min-w-0">
                  {item.action === "CREATE" && (
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                  )}
                  {item.action === "UPDATE" && (
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </div>
                  )}
                  {item.action === "DELETE" && (
                    <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm text-slate-700 truncate group-hover:text-slate-900 transition-colors">{item.description}</p>
                    <p className="text-xs text-slate-500" suppressHydrationWarning>
                      {formatDateTime(item.createdAt)}
                    </p>
                  </div>
                </div>
              );

              if (isDelete) {
                return (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 transition-colors group">
                    {content}
                  </div>
                );
              }

              return (
                <Link key={item.id} href={href} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 transition-colors group cursor-pointer">
                  {content}
                </Link>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
