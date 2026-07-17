"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import clsx from "clsx";

interface PaginationProps {
  totalPages: number;
}

export default function Pagination({ totalPages }: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;

  if (totalPages <= 1) return null;

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  const pages = [];
  
  // Show 5 pages max around current page
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, currentPage + 2);
  
  if (currentPage <= 2) {
    endPage = Math.min(totalPages, 5);
  }
  
  if (currentPage >= totalPages - 1) {
    startPage = Math.max(1, totalPages - 4);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center space-x-2 mt-8">
      {/* Previous Button */}
      {currentPage > 1 ? (
        <Link
          href={createPageURL(currentPage - 1)}
          className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-primary-600 transition-colors shadow-sm"
          aria-label="Previous page"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
      ) : (
        <button
          disabled
          className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-300 cursor-not-allowed shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Page Numbers */}
      <div className="flex items-center space-x-1">
        {startPage > 1 && (
          <>
            <Link
              href={createPageURL(1)}
              className="w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-primary-600 transition-colors shadow-sm"
            >
              1
            </Link>
            {startPage > 2 && <span className="px-2 text-slate-400">...</span>}
          </>
        )}
        
        {pages.map((page) => (
          <Link
            key={page}
            href={createPageURL(page)}
            className={clsx(
              "w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-all shadow-sm",
              page === currentPage
                ? "bg-primary-600 text-white border-transparent hover:bg-primary-700 shadow-md"
                : "bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-primary-600"
            )}
          >
            {page}
          </Link>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-2 text-slate-400">...</span>}
            <Link
              href={createPageURL(totalPages)}
              className="w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-primary-600 transition-colors shadow-sm"
            >
              {totalPages}
            </Link>
          </>
        )}
      </div>

      {/* Next Button */}
      {currentPage < totalPages ? (
        <Link
          href={createPageURL(currentPage + 1)}
          className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-primary-600 transition-colors shadow-sm"
          aria-label="Next page"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      ) : (
        <button
          disabled
          className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-300 cursor-not-allowed shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  );
}
