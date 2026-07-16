import React from "react";
import { Pencil, Trash, Eye } from "lucide-react";

const Table = ({
  columns,
  data = [],
  onEdit,
  onDelete,
  onView,
  viewLabel = "View",
  viewIcon,
  loading = false,
  emptyMessage = "No data found",
  emptyDescription = "There are no records to display at this moment.",
  onEmptyAction,
  emptyActionText = "Reset filters",
}) => {
  const ViewIcon = viewIcon || Eye;

  const getValue = (obj, path, fallback = "-") => {
    if (typeof path !== "string") return fallback;
    return path.split(".").reduce((acc, key) => acc?.[key], obj) ?? fallback;
  };

  if (loading) {
    return (
      <div className="w-full bg-cn-surface border border-cn-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-cn-border">
          <div className="h-4 bg-violet-50 rounded animate-[cn-shimmer_1.4s_infinite] w-1/4"></div>
        </div>
        <div className="p-4 space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-center gap-4 py-2 border-b border-violet-50 last:border-b-0">
              <span className="w-8 h-8 rounded-full bg-violet-50 animate-[cn-shimmer_1.4s_infinite] shrink-0"></span>
              <span className="h-4 bg-violet-50 rounded animate-[cn-shimmer_1.4s_infinite] w-1/3"></span>
              <span className="h-4 bg-violet-50 rounded animate-[cn-shimmer_1.4s_infinite] w-1/4 ml-auto"></span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!loading && (!data || data.length === 0)) {
    return (
      <div className="w-full bg-cn-surface border border-cn-border rounded-xl p-8 flex flex-col items-center justify-center text-center">
        <div className="w-11 h-11 rounded-xl bg-violet-50 text-violet-500 flex items-center justify-center text-xl mb-3 font-semibold">
          ⌕
        </div>
        <h3 className="text-sm font-semibold text-ink-900 mb-1">{emptyMessage}</h3>
        <p className="text-xs text-ink-500 max-w-sm mb-4 leading-relaxed">{emptyDescription}</p>
        {onEmptyAction && (
          <button
            onClick={onEmptyAction}
            className="h-8 px-4 bg-white border border-cn-border-strong text-violet-700 hover:bg-violet-50 font-semibold rounded-lg text-xs transition duration-150"
          >
            {emptyActionText}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-cn-surface border border-cn-border rounded-xl">
      <table className="min-w-full font-sans text-left border-collapse">
        <thead>
          <tr className="border-b border-cn-border bg-violet-50/50">
            {columns.map((col) => (
              <th
                key={col.header}
                className="p-3 text-[11.5px] font-semibold tracking-wider text-ink-500 uppercase select-none font-sans"
              >
                {col.header}
              </th>
            ))}
            {(onView || onEdit || onDelete) && (
              <th className="p-3 text-[11.5px] font-semibold tracking-wider text-ink-500 uppercase text-right">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="text-[13.5px] text-ink-700 divide-y divide-violet-50">
          {data.map((row, idx) => (
            <tr key={idx} className="hover:bg-violet-50 transition duration-150">
              {columns.map((col) => {
                let cellValue;

                if (col.render) {
                  cellValue = col.render(row);
                } else if (typeof col.accessor === "function") {
                  cellValue = col.accessor(row);
                } else if (col.accessor === "avatar") {
                  cellValue = (
                    <img
                      src={getValue(row, col.accessor)}
                      alt="Avatar"
                      className="w-8 h-8 rounded-full object-cover border border-violet-100"
                    />
                  );
                } else {
                  cellValue = getValue(row, col.accessor);
                }

                const isNumeric = typeof cellValue === "number" || (typeof cellValue === "string" && /^[₹$0-9.,%-]+$/.test(cellValue.trim()));
                return (
                  <td
                    key={col.header}
                    className={`p-3 font-sans ${isNumeric ? "font-variant-numeric-tabular-nums" : ""}`}
                  >
                    {cellValue}
                  </td>
                );
              })}
              {(onView || onEdit || onDelete) && (
                <td className="p-3 text-right">
                  <div className="inline-flex gap-1 justify-end">
                    {onView && (
                      <button
                        onClick={() => onView(row)}
                        className="w-7 h-7 inline-flex items-center justify-center text-ink-500 hover:bg-violet-100 hover:text-violet-700 rounded-md transition duration-150 cursor-pointer"
                        title={viewLabel}
                      >
                        <ViewIcon className="w-4 h-4" />
                      </button>
                    )}
                    {onEdit && (
                      <button
                        onClick={() => onEdit(row)}
                        className="w-7 h-7 inline-flex items-center justify-center text-ink-500 hover:bg-violet-100 hover:text-violet-700 rounded-md transition duration-150 cursor-pointer"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(row)}
                        className="w-7 h-7 inline-flex items-center justify-center text-error-hex hover:bg-red-50 hover:text-red-700 rounded-md transition duration-150 cursor-pointer"
                        title="Delete"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
