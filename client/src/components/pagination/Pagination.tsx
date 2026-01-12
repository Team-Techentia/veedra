import { PaginationResponse } from "@/lib/types";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  pagination: PaginationResponse | null;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (limit: number) => void;
  itemsPerPageArray?: number[];
}

export function Pagination({
  pagination,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageArray = [5, 10, 25, 50, 100],
}: PaginationProps) {
  const {
    currentPage = 1,
    totalPages = 1,
    totalCount = 0,
    limit = 10,
  } = pagination || {};

  const visiblePages = getVisiblePages(currentPage, totalPages);

  return (
    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
      <div className="flex-1 flex justify-between items-center">
        <p className="text-sm text-gray-700 mr-4">
          Showing {!totalCount ? totalCount : (currentPage - 1) * limit + 1} to{" "}
          {Math.min(currentPage * limit, totalCount)} of {totalCount} results
        </p>
        <select
          value={limit}
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {itemsPerPageArray.map((n) => (
            <option key={n} value={n}>
              {n} per page
            </option>
          ))}
        </select>

        <nav className="inline-flex rounded-md shadow-sm -space-x-px ml-4">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-2 py-2 border rounded-l-md bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {visiblePages.map((page, idx) =>
            page === "…" ? (
              <span
                key={`ellipsis-${idx}`}
                className="px-3 py-2 border border-gray-300 text-gray-400 select-none"
              >
                …
              </span>
            ) : (
              <button
                key={page}
                onClick={() =>
                  onPageChange(typeof page === "number" ? page : parseInt(page))
                }
                className={`px-4 py-2 border text-sm font-medium ${
                  page === currentPage
                    ? "bg-blue-50 border-blue-500 text-blue-600"
                    : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                }`}
              >
                {page}
              </button>
            )
          )}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-2 py-2 border rounded-r-md bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </nav>
      </div>
    </div>
  );
}

export const getVisiblePages = (
  currentPage: number,
  totalPages: number,
  maxSlots = 7
): (number | string)[] => {
  const pages: (number | string)[] = [];

  if (totalPages <= maxSlots) {
    // Show all pages if small
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return pages;
  }

  // Always show first and last page
  const firstPage = 1;
  const lastPage = totalPages;

  if (currentPage <= 4) {
    // Near the beginning
    pages.push(1, 2, 3, 4, 5, "…", lastPage);
  } else if (currentPage >= totalPages - 3) {
    // Near the end
    pages.push(
      firstPage,
      "…",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      lastPage
    );
  } else {
    // Middle
    pages.push(
      firstPage,
      "…",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "…",
      lastPage
    );
  }

  return pages;
};
