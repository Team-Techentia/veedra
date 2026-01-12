// @/hooks/useFilter.ts
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { entitySchema } from '@/lib/consts';
import { EntityType } from '@/lib/types';
import { helperClientUtils } from '@/lib/utils';

export const useFilter = (modelName: EntityType) => {
    const schema = entitySchema[modelName];

    if (!schema) {
        throw new Error(`Filter schema not found for model: ${modelName}`);
    }

    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();

    const [filters, setFilters] = useState(() => helperClientUtils.parseQueryString(searchParams?.toString() ?? "", schema.defaultFilters));

    const queryObject = useMemo(() => {
        return helperClientUtils.buildSafeQuery(filters);
    }, [filters]);

    const activeFilters = useMemo(() => {
        return helperClientUtils.toQueryString(queryObject);
    }, [queryObject]);

    useEffect(() => {
        const currentParams = searchParams?.toString();
        if (activeFilters !== currentParams) {
            router.replace(`${pathname}?${activeFilters}`, { scroll: false });
        }
    }, [activeFilters, pathname, router, searchParams]);

    const setFilter = useCallback((key: string, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }, []);

    const setFiltersBulk = useCallback((updates: Record<string, any>) => {
        setFilters(prev => ({ ...prev, ...updates }));
    }, []);

    const removeFilter = useCallback((key: string) => {
        setFilters(prev => {
            const newFilters = { ...prev };
            delete newFilters[key];
            return newFilters;
        });
    }, []);

    const resetFilters = useCallback(() => {
        setFilters(schema.defaultFilters);
    }, [schema.defaultFilters]);

    return {
        filters,
        queryObject,
        activeFilters,
        setFilter,
        setFiltersBulk,
        removeFilter,
        resetFilters,
        schema
    };
};