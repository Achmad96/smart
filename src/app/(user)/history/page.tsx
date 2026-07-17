import { getAllActivities } from "@/actions/activity.actions";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const activities = await getAllActivities();

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="space-y-3 stagger-children">
        {activities.map((activity) => {
          const href = activity.entityType === "CORRESPONDENCE" 
            ? `/correspondence/${activity.entityId}` 
            : `/manage-templates/${activity.entityId}`;
            
          return (
            <Link key={activity.id} href={href} className="block">
              <Card hover glass className="flex items-start gap-4 p-4">
                <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  {activity.action === "CREATE" && (
                    <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                  )}
                  {activity.action === "UPDATE" && (
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  )}
                  {activity.action === "DELETE" && (
                    <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={activity.action === "CREATE" ? "success" : activity.action === "UPDATE" ? "default" : "danger"}>{activity.action}</Badge>
                    <span className="text-xs font-medium text-slate-500">{activity.entityType}</span>
                    <span className="text-slate-700">•</span>
                    <span className="text-xs text-slate-500" suppressHydrationWarning>
                      {formatDateTime(activity.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 mb-0.5">{activity.entityTitle}</p>
                  <p className="text-sm text-slate-600 line-clamp-2">{activity.description}</p>
                </div>
              </Card>
            </Link>
          );
        })}

        {activities.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500">Belum ada riwayat aktivitas.</p>
          </div>
        )}
      </div>
    </div>
  );
}
