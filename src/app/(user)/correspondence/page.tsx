import { getCorrespondences } from "@/actions/correspondence.actions";
import Card from "@/components/ui/Card";
import Link from "next/link";
import { formatDateTime, getCategoryColor } from "@/lib/utils";
import DeleteCorrespondenceButton from "@/components/ui/DeleteCorrespondenceButton";
import SearchInput from "@/components/ui/SearchInput";
import Pagination from "@/components/ui/Pagination";

export const dynamic = "force-dynamic";

export default async function CorrespondenceListPage({ searchParams }: { searchParams: Promise<{ status?: string; page?: string; search?: string }> }) {
  const { status, page, search } = await searchParams;

  const filters: Record<string, any> = {};
  if (status && status !== "all") filters.status = status;
  if (page) filters.page = Number(page);
  if (search) filters.search = search;

  const result = await getCorrespondences(filters);
  const correspondences = result.data;

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <SearchInput placeholder="Cari surat (judul atau NIK)..." />
        <Link href="/templates/new-correspondence" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-all shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Baru
        </Link>
      </div>

      {correspondences.length === 0 ? (
        <Card glass>
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-500">Tidak ada surat ditemukan</p>
            <p className="text-xs text-slate-600 mt-1">Buat surat pertama Anda untuk memulai</p>
            <Link href="/templates/new-correspondence" className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-all">
              Buat Baru
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-3 stagger-children">
          {correspondences.map((item) => (
            <Link key={item.id} href={`/correspondence/${item.id}`} className="block group">
              <Card hover glass className="flex items-center justify-between">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-primary-500/10 flex items-center justify-center shrink-0 group-hover:bg-primary-500/20 transition-colors">
                    <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-primary-300 transition-colors">{item.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {/* <Badge className={getCategoryColor(item.template?.category || "")}>{item.template?.name}</Badge> */}
                      <span className="text-xs text-slate-500" suppressHydrationWarning>
                        {formatDateTime(item.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center">
                    <DeleteCorrespondenceButton id={item.id} />
                  </div>
                  <svg className="w-5 h-5 text-slate-600 group-hover:text-slate-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {result.totalPages > 1 && <Pagination totalPages={result.totalPages} />}
    </div>
  );
}
