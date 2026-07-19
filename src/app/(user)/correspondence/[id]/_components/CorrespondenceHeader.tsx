import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { formatDateTime, getCategoryColor } from "@/lib/utils";
import DownloadDocxButton from "../DownloadDocxButton";

interface CorrespondenceHeaderProps {
  correspondence: any;
  template: any;
  fields: any[];
  formattedFieldValues: Record<string, string>;
  isDocxOverlay: boolean;
  headerImageUrl: string | null;
}

export default function CorrespondenceHeader({
  correspondence,
  template,
  fields,
  formattedFieldValues,
  isDocxOverlay,
  headerImageUrl
}: CorrespondenceHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-xl font-bold text-slate-900">{correspondence.title}</h2>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Badge className={getCategoryColor(template?.category || "")}>{template?.name}</Badge>
          <span className="text-xs text-slate-500" suppressHydrationWarning>
            Dibuat pada {formatDateTime(correspondence.createdAt)}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link href={`/correspondence/${correspondence.id}/edit`} className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-all rounded-xl shadow-sm text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500/20 active:scale-95 disabled:opacity-50 disabled:pointer-events-none no-print">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit
        </Link>
        {isDocxOverlay && <DownloadDocxButton url={correspondence.uploadedFileUrl || headerImageUrl || ""} fields={fields} fieldValues={formattedFieldValues} downloadTitle={correspondence.title} />}
      </div>
    </div>
  );
}
