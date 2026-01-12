// @/components/Table.tsx
"use client";

import React, { Dispatch, SetStateAction } from "react";
import { ColumnConfig } from "@/lib/types";

interface TableProps<T> {
  data: T[];
  columns: ColumnConfig<T>[];
  visibleColumns: Set<keyof T | string>;
  sortField: keyof T | string | null;
  sortDirection: "asc" | "desc";
  toggleSort: (field: keyof T) => void;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: Dispatch<SetStateAction<string[]>>;
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onApprove?: (row: T) => void;
  onReject?: (row: T) => void;
  onCancel?: (row: T) => void;

  /** ✅ Optional custom cell renderers (key = field name) */
  customRenderers?: {
    [key: string]: (value: any, row: T) => React.ReactNode;
  };
}

export function Table<T extends { _id?: string }>({
  data,
  columns,
  visibleColumns,
  sortField,
  sortDirection,
  toggleSort,
  onView,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  customRenderers,
}: TableProps<T>) {
  const visibleCols = columns.filter((c) => visibleColumns.has(c.key));

  return (
    <div className="overflow-x-auto thin-scrollbar border rounded-md">
      <table className="w-full table-auto text-sm min-w-full">
        <thead className="bg-gray-50">
          <tr>
            {visibleCols.map((col, idx) => (
              <th
                key={String(col.key) + idx}
                onClick={() =>
                  col.sortable ? toggleSort(col.key as keyof T) : undefined
                }
                className={`px-4 py-2 text-left font-semibold whitespace-nowrap ${
                  col.sortable ? "cursor-pointer select-none" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  {col.label}
                  {col.sortable && (
                    <div className="flex flex-col ml-1">
                      <span
                        className={`text-[10px] leading-2.5 ${
                          sortField === col.key && sortDirection === "asc"
                            ? "text-gray-900"
                            : "text-gray-400"
                        }`}
                      >
                        ▲
                      </span>
                      <span
                        className={`text-[10px] leading-2.5 ${
                          sortField === col.key && sortDirection === "desc"
                            ? "text-gray-900"
                            : "text-gray-400"
                        }`}
                      >
                        ▼
                      </span>
                    </div>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.length > 0 ? (
            data.map((row) => (
              <tr
                key={row._id || JSON.stringify(row)}
                className="border-t hover:bg-gray-50 transition-colors"
              >
                {visibleCols.map((col, idx) => {
                  const value = row[col.key as keyof T];
                  const customRenderer = customRenderers?.[String(col.key)];

                  return (
                    <td
                      key={String(col.key) + idx}
                      className="px-4 py-2 whitespace-nowrap"
                    >
                      {customRenderer
                        ? customRenderer(value, row)
                        : col.render
                        ? col.render(value, row, {
                            onView,
                            onEdit,
                            onDelete,
                            onApprove,
                            onReject,
                          })
                        : String(value ?? "-")}
                    </td>
                  );
                })}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={visibleCols.length}
                className="text-center py-6 text-gray-500"
              >
                No records found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
