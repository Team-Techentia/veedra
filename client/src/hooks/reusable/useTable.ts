"use client";
import { useState } from "react";
import { ColumnConfig, FilterParams } from "@/lib/types";

export function useTable<T extends Record<string, any>>(
    columns: ColumnConfig<T>[],
    filters: FilterParams,
    setFilter: (key: string, value: any) => void
) {
    // Track visible columns in state
    const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
        () => new Set(columns.filter((c) => c.visible).map((c) => String(c.key)))
    );

    const sortField = filters.sortBy as keyof T | null;
    const sortDirection = filters.sortOrder as "asc" | "desc";

    const toggleSort = (field: keyof T) => {
        if (sortField === field) {
            setFilter("sortOrder", sortDirection === "asc" ? "desc" : "asc");
        } else {
            setFilter("sortBy", field);
            setFilter("sortOrder", "asc");
        }
    };

    const columnOptions = columns.map((c) => ({ value: String(c.key), label: c.label, }));

    const handleColumnChange = (selected: string | string[]) => {
        const values = Array.isArray(selected) ? selected : [selected];
        setVisibleColumns(new Set(values));
    };

    return { visibleColumns, toggleSort, columnOptions, handleColumnChange, };
};