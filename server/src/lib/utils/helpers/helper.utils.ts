import mongoose from "mongoose";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs"

interface HelperQueryOptions<T> {
  filter: Record<string, any>;
  pagination: {
    page: number;
    limit: number;
    skip: number;
  };
  sort: Record<string, 1 | -1>;
}

export const helperUtils = {
  buildQuery<T>(
    queryParams: Record<string, any>,
    allowedFilters: string[],
    defaultSort: string = "createdAt",
    searchableFields: string[] = []
  ): HelperQueryOptions<T> {
    // Simple & Range filters
    const filter: Record<string, any> = {};
    const validOperators = ["gte", "lte", "gt", "lt", "ne", "in", "nin", "exists",];

    // ✅ Build a map of nested paths for quick lookup
    const nestedPaths = new Set(allowedFilters.filter((f) => f.includes(".")));

    for (const key of allowedFilters) {
      const rawValue = queryParams[key as string];
      const rawObj = queryParams[key as string];

      if (rawValue === undefined || rawValue === null) continue;

      // ✅ Case: range filters like ?price[gte]=100&price[lte]=500 OR ?variants.price[gte]=100
      if (
        typeof rawObj === "object" &&
        rawObj !== null &&
        !Array.isArray(rawObj)
      ) {
        const ops: Record<string, any> = {};
        for (const op in rawObj) {
          if (!validOperators.includes(op)) continue;

          const opValue = rawObj[op];
          if (opValue === undefined || opValue === null || opValue === "")
            continue;

          const parsed = this.safeToNumber(opValue);
          if (!isNaN(parsed) && isFinite(parsed)) {
            try {
              // Always prefer Decimal128 for consistency
              ops[`$${op}`] = mongoose.Types.Decimal128.fromString(
                String(parsed)
              );
            } catch {
              ops[`$${op}`] = parsed;
            }
          } else if (typeof opValue === "string" && opValue.trim()) {
            const trimmed = opValue.trim();
            if (mongoose.Types.ObjectId.isValid(trimmed)) {
              ops[`$${op}`] = new mongoose.Types.ObjectId(trimmed);
            } else {
              ops[`$${op}`] = trimmed;
            }
          }
        }
        if (Object.keys(ops).length > 0) {
          // ✅ Set nested path directly - MongoDB supports dot notation
          filter[key as string] = ops;
        }
      }

      // ✅ Case: simple equality
      else {
        let value: any = rawValue;

        if (value === "all") continue; // skip filter if "all" is sent

        if (value === "true") value = true;
        else if (value === "false") value = false;
        else if (value === "") value = null;
        // ✅ Handle comma-separated values → `$in`
        else if (typeof value === "string" && value.includes(",")) {
          const parts = value
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean)
            .slice(0, 100);

          if (parts.length > 0) {
            const parsedParts = parts.map((p) => {
              if (p === "true") return true;
              if (p === "false") return false;
              if (mongoose.Types.ObjectId.isValid(p))
                return new mongoose.Types.ObjectId(p);

              const parsed = this.safeToNumber(p);
              if (!isNaN(parsed) && isFinite(parsed)) {
                try {
                  return mongoose.Types.Decimal128.fromString(String(parsed));
                } catch {
                  return parsed;
                }
              }
              return p;
            });
            value = { $in: parsedParts };
          } else {
            value = null;
          }
        }

        // ✅ Single values
        else if (typeof value === "string" && value.trim()) {
          const trimmed = value.trim();
          if (mongoose.Types.ObjectId.isValid(trimmed)) {
            value = new mongoose.Types.ObjectId(trimmed);
          } else {
            const parsed = this.safeToNumber(trimmed);
            if (!isNaN(parsed) && isFinite(parsed)) {
              try {
                value = mongoose.Types.Decimal128.fromString(String(parsed));
              } catch {
                value = parsed;
              }
            } else {
              value = trimmed;
            }
          }
        } else {
          const parsed = this.safeToNumber(value);
          if (!isNaN(parsed) && isFinite(parsed)) {
            try {
              value = mongoose.Types.Decimal128.fromString(String(parsed));
            } catch {
              value = parsed;
            }
          }
        }

        if (value !== null && value !== undefined) {
          // ✅ Set nested path directly
          filter[key as string] = value;
        }
      }
    }

    // ✅ NEW: Handle bracket notation like variants.price[gte]=10
    for (const queryKey in queryParams) {
      const match = queryKey.match(/^(.+)\[(\w+)\]$/);
      if (match) {
        const [, fieldName, operator] = match;

        // Check if this field is allowed
        if (!allowedFilters.includes(fieldName)) continue;
        if (!validOperators.includes(operator)) continue;

        const opValue = queryParams[queryKey];
        if (opValue === undefined || opValue === null || opValue === "")
          continue;

        // Initialize filter for this field if needed
        if (!filter[fieldName]) {
          filter[fieldName] = {};
        }
        // Make sure we're working with an object
        if (
          typeof filter[fieldName] !== "object" ||
          Array.isArray(filter[fieldName])
        ) {
          filter[fieldName] = {};
        }

        const parsed = this.safeToNumber(opValue);
        if (!isNaN(parsed) && isFinite(parsed)) {
          try {
            filter[fieldName][`$${operator}`] =
              mongoose.Types.Decimal128.fromString(String(parsed));
          } catch {
            filter[fieldName][`$${operator}`] = parsed;
          }
        } else if (typeof opValue === "string" && opValue.trim()) {
          const trimmed = opValue.trim();
          if (mongoose.Types.ObjectId.isValid(trimmed)) {
            filter[fieldName][`$${operator}`] = new mongoose.Types.ObjectId(
              trimmed
            );
          } else {
            filter[fieldName][`$${operator}`] = trimmed;
          }
        }
      }
    }

    // ✅ Date range
    if (queryParams.dateRange || queryParams.dateFrom || queryParams.dateTo) {
      filter["createdAt"] = {};
      const now = new Date();

      if (queryParams.dateRange && queryParams.dateRange !== "custom") {
        const range = String(queryParams.dateRange);
        let fromDate = new Date();

        if (range.endsWith("d")) {
          const days = parseInt(range.replace("d", ""), 10);
          if (!isNaN(days) && days > 0) {
            fromDate.setDate(now.getDate() - days);
          }
        } else if (range.endsWith("m")) {
          const months = parseInt(range.replace("m", ""), 10);
          if (!isNaN(months) && months > 0) {
            fromDate.setMonth(now.getMonth() - months);
          }
        } else if (range.endsWith("y")) {
          const years = parseInt(range.replace("y", ""), 10);
          if (!isNaN(years) && years > 0) {
            fromDate.setFullYear(now.getFullYear() - years);
          }
        }

        filter["createdAt"].$gte = fromDate;
        filter["createdAt"].$lte = now;
      }

      // Custom from/to
      if (queryParams.dateRange === "custom" || (!queryParams.dateRange && (queryParams.dateFrom || queryParams.dateTo))) {
        if (queryParams.dateFrom) {
          filter["createdAt"].$gte = new Date(queryParams.dateFrom as string);
        }
        if (queryParams.dateTo) {
          filter["createdAt"].$lte = new Date(queryParams.dateTo as string);
        }
      }
    }

    // Search
    if (typeof queryParams.search === "string" && queryParams.search.trim() && searchableFields.length > 0) {
      const searchTerm = queryParams.search.trim();
      const regex = { $regex: searchTerm, $options: "i" };

      // Support nested fields like "variants.sku"
      filter.$or = searchableFields.map((field) => ({ [field]: regex, }));
    }

    // Pagination
    const page = Math.max(1, this.safeToNumber(queryParams.page) || 1);
    const limit = Math.min(200, Math.max(1, this.safeToNumber(queryParams.limit) || 10));
    const skip = (page - 1) * limit;

    // ✅ Sorting - Support nested fields
    const allowedSortFields = [...allowedFilters, defaultSort];
    const sortBy = allowedSortFields.includes(queryParams.sortBy) ? queryParams.sortBy : defaultSort;
    const sortOrder = queryParams.sortOrder === "asc" ? 1 : -1;
    const sort = { [sortBy]: sortOrder } as Record<string, 1 | -1>;

    return { filter, pagination: { page, limit, skip }, sort };
  },

  safeToNumber(value: any): number {
    if (!value && value !== 0) return NaN;
    if (typeof value === "number") return value;
    if (
      value &&
      typeof value === "object" &&
      typeof value.toString === "function"
    ) {
      const parsed = parseFloat(value.toString());
      return isNaN(parsed) ? NaN : parsed;
    }
    const parsed = parseFloat(String(value));
    return isNaN(parsed) ? NaN : parsed;
  },

  password: {
    async hash(rawPassword: string) {
      if (!rawPassword || rawPassword.length < 6) throw new Error("Password too short");
      const saltRounds = 10;
      return bcrypt.hash(rawPassword, saltRounds);
    },

    async compare(rawPassword: string, passwordHash: string) {
      if (!rawPassword || !passwordHash) return false;
      return bcrypt.compare(rawPassword, passwordHash);
    },
  },

  id: {
    nanoid(size: number = 14) {
      return nanoid(size);
    },
  },

  mongo: {
    toObjectId(id: string | mongoose.Types.ObjectId) {
      if (id instanceof mongoose.Types.ObjectId) return id;
      if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid ObjectId");
      return new mongoose.Types.ObjectId(id);
    },
    isValidObjectId(id: any) {
      return mongoose.Types.ObjectId.isValid(id);
    },
  },
};
