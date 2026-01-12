"use client";
import { useEffect } from "react";


export const usePagination = (setFilter: (key: string, value: any) => void) => {

    const handlePageChange = (page: number) => setFilter('page', page);
    const handleItemsPerPageChange = (limit: number) => {
        setFilter('limit', limit);
        setFilter('page', 1);
    };

    return { handlePageChange, handleItemsPerPageChange };
};