import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const Pagination = ({ page, totalPages, count, pageSize, onPageChange, loading }) => {
  if (totalPages <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, count);

  return (
    <div className="flex items-center justify-between mt-3 px-1 text-[12.5px] text-ink-500">
      <span>
        Showing <b className="text-ink-700">{start}-{end}</b> of <b className="text-ink-700">{count}</b>
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1 || loading}
          onClick={() => onPageChange(page - 1)}
          className="w-7 h-7 inline-flex items-center justify-center rounded-md border border-cn-border text-ink-600 hover:bg-violet-50 hover:text-violet-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
        >
          <ChevronLeft size={15} />
        </button>
        <span className="font-semibold text-ink-700">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages || loading}
          onClick={() => onPageChange(page + 1)}
          className="w-7 h-7 inline-flex items-center justify-center rounded-md border border-cn-border text-ink-600 hover:bg-violet-50 hover:text-violet-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
