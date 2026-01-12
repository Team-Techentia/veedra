import { FilterSchema } from "@/lib/types";
import Image from "next/image";
import { Edit, Eye, Trash2 } from "lucide-react";
import { ProductType } from "@/lib/types/product/product.types";

export const productEntitySchema: FilterSchema<ProductType> = {
  /* -------------------- SECTIONS -------------------- */
  sections: ["Basic", "Pricing", "Inventory", "Date Range"],

  /* -------------------- FILTER FIELDS -------------------- */
  fields: [
    // ===== BASIC =====
    {
      key: "search",
      label: "Search",
      type: "text",
      section: "Basic",
      placeholder: "Search by name or Product ID",
    },
    {
      key: "status",
      label: "Stock Status",
      type: "select",
      section: "Basic",
      options: [
        { value: "", label: "All" },
        { value: "In Stock", label: "In Stock" },
        { value: "Out of Stock", label: "Out of Stock" },
      ],
      defaultValue: "",
    },
    {
      key: "isActive",
      label: "Active Only",
      type: "boolean",
      section: "Basic",
    },
    {
      key: "isDeleted",
      label: "Include Deleted",
      type: "boolean",
      section: "Basic",
    },

    // ===== PRICING =====
    {
      key: "price",
      label: "Price Range",
      type: "range",
      section: "Pricing",
      rangeConfig: { min: 0, max: 100000, step: 100, prefix: "₹" },
    },

    // ===== INVENTORY =====
    {
      key: "stock",
      label: "Stock Quantity",
      type: "range",
      section: "Inventory",
      rangeConfig: { min: 0, max: 10000, step: 1 },
    },

    // ===== DATE RANGE =====
    {
      key: "dateRange",
      label: "Quick Date Range",
      type: "select",
      section: "Date Range",
      options: [
        { value: "", label: "All Time" },
        { value: "7d", label: "Last 7 Days" },
        { value: "30d", label: "Last 30 Days" },
        { value: "3m", label: "Last 3 Months" },
        { value: "6m", label: "Last 6 Months" },
        { value: "1y", label: "Last Year" },
      ],
      defaultValue: "",
    },
    {
      key: "dateFrom",
      label: "From Date",
      type: "date",
      section: "Date Range",
    },
    {
      key: "dateTo",
      label: "To Date",
      type: "date",
      section: "Date Range",
    },
  ],

  /* -------------------- DEFAULT FILTERS -------------------- */
  defaultFilters: {
    search: "",
    status: "",
    isActive: undefined,
    isDeleted: undefined,
    price: { gte: undefined, lte: undefined },
    stock: { gte: undefined, lte: undefined },
    dateRange: undefined,
    dateFrom: undefined,
    dateTo: undefined,
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  },

  /* -------------------- STATS CARDS -------------------- */
  statsCards: [
    {
      key: "totalProducts",
      title: "Total Products",
      icon: "Package",
      color: "bg-blue-500",
    },
    {
      key: "activeProducts",
      title: "Active Products",
      icon: "TrendingUp",
      color: "bg-green-500",
    },
    {
      key: "outOfStock",
      title: "Out of Stock",
      icon: "AlertTriangle",
      color: "bg-red-500",
    },
  ],

  /* -------------------- TABLE COLUMNS -------------------- */
  tableColumns: [
    {
      key: "productId",
      label: "Product ID",
      sortable: true,
      visible: true,
    },
    {
      key: "name",
      label: "Product Name",
      sortable: true,
      visible: true,
    },
    {
      key: "price",
      label: "Price",
      sortable: true,
      visible: true,
      render: (v: number) => `₹${v}`,
    },
    {
      key: "stock",
      label: "Stock",
      sortable: true,
      visible: true,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      visible: true,
      render: (v: string) => (
        <span
          className={
            v === "In Stock"
              ? "text-green-600"
              : "text-red-600"
          }
        >
          {v}
        </span>
      ),
    },
    {
      key: "isActive",
      label: "Active",
      sortable: true,
      visible: true,
      render: (v: boolean) => (
        <span className={v ? "text-green-600" : "text-gray-400"}>
          {v ? "✓ Yes" : "✗ No"}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Created At",
      sortable: true,
      visible: false,
      render: (v: string) => new Date(v).toLocaleDateString(),
    },
    {
      key: "updatedAt",
      label: "Updated At",
      sortable: true,
      visible: false,
      render: (v: string) => new Date(v).toLocaleDateString(),
    },
    {
      key: "actions",
      label: "Actions",
      visible: true,
      render: (_, row, handlers) => (
        <div className="flex gap-2">
          {handlers?.onView && (
            <button
              onClick={() => handlers.onView!(row)}
              className="p-1 text-gray-600 hover:text-gray-800"
            >
              <Eye size={16} />
            </button>
          )}
          {handlers?.onEdit && (
            <button
              onClick={() => handlers.onEdit!(row)}
              className="p-1 text-blue-600 hover:text-blue-800"
            >
              <Edit size={16} />
            </button>
          )}
          {handlers?.onDelete && !row.isDeleted && (
            <button
              onClick={() => handlers.onDelete!(row)}
              className="p-1 text-red-600 hover:text-red-800"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ),
    },
  ],
};
