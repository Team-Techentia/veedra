// @/lib/utils/helperClientUtils.ts
export const helperClientUtils = {
  buildSafeQuery(params: Record<string, any>) {
    const query: Record<string, any> = {};

    Object.entries(params).forEach(([key, value]) => {
      if (value == null) return;

      // ✅ Range filter
      if (typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
        const ops: Record<string, string | number> = {};
        Object.entries(value).forEach(([op, v]) => {
          if (v == null || v === "") return;
          ops[op] = v instanceof Date ? v.toISOString() : String(v).trim();
        });
        if (Object.keys(ops).length > 0) query[key] = ops;
      }

      // ✅ Arrays → comma-separated
      else if (Array.isArray(value)) {
        const parts = value.map(v => (v != null ? String(v).trim() : "")).filter(Boolean);
        if (parts.length > 0) query[key] = parts.join(",");
      }

      // ✅ Dates
      else if (value instanceof Date) {
        query[key] = value.toISOString();
      }

      // ✅ Primitive values
      else if (typeof value === "boolean" || typeof value === "number" || (typeof value === "string" && value.trim() !== "")) {
        query[key] = String(value).trim();
      }
    });

    // ✅ Pagination
    query.page = Math.max(1, Number(params.page) || 1);
    query.limit = Math.min(100, Math.max(1, Number(params.limit) || 10));

    // ✅ Sorting
    if (params.sortBy) query.sortBy = params.sortBy;
    if (params.sortOrder) query.sortOrder = params.sortOrder === "asc" ? "asc" : "desc";

    // ✅ Dates
    if (params.dateRange) query.dateRange = String(params.dateRange);
    if (params.dateFrom) query.dateFrom = params.dateFrom instanceof Date ? params.dateFrom.toISOString() : String(params.dateFrom);
    if (params.dateTo) query.dateTo = params.dateTo instanceof Date ? params.dateTo.toISOString() : String(params.dateTo);

    // ✅ Search
    if (params.search && typeof params.search === "string") {
      query.search = params.search.trim();
    }

    return query;
  },

  toQueryString(params: Record<string, any>) {
    return new URLSearchParams(params as Record<string, string>).toString();
  },

  parseQueryString<T extends Record<string, any>>(search: string, defaults: T): T {
    const urlParams = new URLSearchParams(search);
    const filters: Record<string, any> = { ...defaults };

    urlParams.forEach((value, key) => {
      // ✅ Handle nested range keys like priceUsd[gte]
      if (key.includes("[")) {
        const [base, op] = key.split(/\[|\]/).filter(Boolean);
        if (!filters[base]) filters[base] = {};
        filters[base][op] = isNaN(Number(value)) ? value : Number(value);
      }

      // ✅ Comma → array
      else if (value.includes(",")) {
        filters[key] = value.split(",").map(v => (isNaN(Number(v)) ? v : Number(v)));
      }

      // ✅ Numbers
      else if (!isNaN(Number(value))) {
        filters[key] = Number(value);
      }

      // ✅ Booleans
      else if (value === "true" || value === "false") {
        filters[key] = value === "true";
      }

      // ✅ Default string
      else {
        filters[key] = value;
      }
    });

    return filters as T;
  }
};
