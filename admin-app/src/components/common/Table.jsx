import React from 'react';
import { ArrowUpDown, Inbox } from 'lucide-react';

export const Table = ({
  columns = [],
  data = [],
  isLoading = false,
  emptyMessage = 'No records found.',
  onRowClick,
  sortColumn,
  sortDirection,
  onSort,
}) => {
  if (isLoading) {
    return (
      <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        <div className="p-8 text-center text-slate-400">Loading data...</div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {columns.map((col, idx) => (
                <th
                  key={col.key || idx}
                  className={`py-3.5 px-4 ${col.sortable ? 'cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-200' : ''} ${col.className || ''}`}
                  onClick={() => col.sortable && onSort && onSort(col.key)}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.header}</span>
                    {col.sortable && (
                      <ArrowUpDown
                        className={`w-3.5 h-3.5 ${
                          sortColumn === col.key ? 'text-amber-500' : 'text-slate-400 opacity-50'
                        }`}
                      />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-slate-400 dark:text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Inbox className="w-8 h-8 opacity-40" />
                    <p className="text-sm font-medium">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr
                  key={row.id || rowIdx}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40 ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                >
                  {columns.map((col, colIdx) => (
                    <td key={col.key || colIdx} className={`py-4 px-4 text-slate-700 dark:text-slate-200 ${col.cellClassName || ''}`}>
                      {col.render ? col.render(row[col.key], row, rowIdx) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
