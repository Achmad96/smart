import Link from "next/link";
import Card from "@/components/ui/Card";
import { formatDateTime } from "@/lib/utils";

interface ActivityItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  createdAt: Date | string;
}

interface RecentActivitySectionProps {
  recentActivity: ActivityItem[];
}

export default function RecentActivitySection({ recentActivity }: RecentActivitySectionProps) {
  if (recentActivity.length === 0) return null;

  return (
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
  );
}
