// @/components/FilterSheet.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FilterSchema, FilterFieldConfig } from '@/lib/types';

interface FilterSheetProps {
    isOpen: boolean;
    onClose: () => void;
    filters: Record<string, any>;
    setFilter: (key: string, value: any) => void;
    resetFilters: () => void;
    schema: FilterSchema;
}

export function FilterSheet({
    isOpen,
    onClose,
    filters,
    setFilter,
    resetFilters,
    schema
}: FilterSheetProps) {
    // ✅ Local state for staged changes
    const [stagedFilters, setStagedFilters] = useState<Record<string, any>>(filters);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(
        new Set(schema.sections.slice(0, 2))
    );

    // ✅ Sync staged filters when actual filters change or modal opens
    useEffect(() => {
        if (isOpen) {
            setStagedFilters(filters);
        }
    }, [isOpen, filters]);

    if (!isOpen) return null;

    const toggleSection = (title: string) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(title)) {
            newExpanded.delete(title);
        } else {
            newExpanded.add(title);
        }
        setExpandedSections(newExpanded);
    };

    // ✅ Update local staged filters only
    const handleStagedFilterChange = (key: string, value: any) => {
        setStagedFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleRangeChange = (key: string, bound: 'gte' | 'lte', value: string | number) => {
        const current = stagedFilters[key] || {};
        const numValue = value === '' ? undefined : Number(value);
        handleStagedFilterChange(key, { ...current, [bound]: numValue });
    };

    // ✅ Apply staged changes to actual filters
    const handleApplyFilters = () => {
        Object.entries(stagedFilters).forEach(([key, value]) => {
            setFilter(key, value);
        });
        onClose();
    };

    // ✅ Reset both staged and actual filters
    const handleResetFilters = () => {
        resetFilters();
        setStagedFilters(schema.defaultFilters);
    };

    // ✅ Cancel changes and close
    const handleCancel = () => {
        setStagedFilters(filters); // Revert to current filters
        onClose();
    };

    const renderFilterField = (field: FilterFieldConfig) => {
        const value = stagedFilters[field.key]; // ✅ Use staged filters

        switch (field.type) {
            case 'select':
                return (
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-gray-700">{field.label}</label>
                        <div className="space-y-2">
                            {field.options?.map((option) => (
                                <label
                                    key={option.value}
                                    className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                                >
                                    <input
                                        type="radio"
                                        name={field.key}
                                        value={option.value}
                                        checked={value === option.value}
                                        onChange={(e) => handleStagedFilterChange(field.key, e.target.value)}
                                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">{option.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                );

            case 'boolean':
                return (
                    <label className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                            type="checkbox"
                            checked={!!value}
                            onChange={(e) => handleStagedFilterChange(field.key, e.target.checked || undefined)}
                            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">{field.label}</span>
                    </label>
                );

            case 'range':
                const config = field.rangeConfig!;
                return (
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-gray-700">{field.label}</label>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Min</label>
                                <div className="relative">
                                    {config.prefix && (
                                        <span className="absolute left-3 top-2 text-gray-500">{config.prefix}</span>
                                    )}
                                    <input
                                        type="number"
                                        value={value?.gte ?? ''}
                                        placeholder="Min"
                                        onChange={(e) => handleRangeChange(field.key, 'gte', e.target.value)}
                                        className={`border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 ${
                                            config.prefix ? 'pl-7' : ''
                                        }`}
                                        min={config.min}
                                        max={config.max}
                                        step={config.step}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Max</label>
                                <div className="relative">
                                    {config.prefix && (
                                        <span className="absolute left-3 top-2 text-gray-500">{config.prefix}</span>
                                    )}
                                    <input
                                        type="number"
                                        value={value?.lte ?? ''}
                                        placeholder="Max"
                                        onChange={(e) => handleRangeChange(field.key, 'lte', e.target.value)}
                                        className={`border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 ${
                                            config.prefix ? 'pl-7' : ''
                                        }`}
                                        min={config.min}
                                        max={config.max}
                                        step={config.step}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'date':
                const isCustom = stagedFilters.dateRange === 'custom';
                if ((field.key === 'dateFrom' || field.key === 'dateTo') && !isCustom) {
                    return null;
                }

                return (
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">{field.label}</label>
                        <DatePicker
                            selected={value ? new Date(value) : null}
                            onChange={(date) => handleStagedFilterChange(field.key, date)}
                            className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                            placeholderText="Select date"
                            dateFormat="MMM dd, yyyy"
                        />
                    </div>
                );

            default:
                return null;
        }
    };

    // Group fields by section
    const fieldsBySection = schema.fields.reduce((acc, field) => {
        if (!acc[field.section]) acc[field.section] = [];
        acc[field.section].push(field);
        return acc;
    }, {} as Record<string, FilterFieldConfig[]>);

    // ✅ Count changes between current and staged filters
    const changesCount = Object.entries(stagedFilters).filter(([key, value]) => {
        if (['page', 'limit', 'sortBy', 'sortOrder', 'search'].includes(key)) return false;
        
        const currentValue = filters[key];
        
        // Compare objects (ranges)
        if (typeof value === 'object' && value !== null && typeof currentValue === 'object' && currentValue !== null) {
            return JSON.stringify(value) !== JSON.stringify(currentValue);
        }
        
        return value !== currentValue;
    }).length;

    const activeFilterCount = Object.entries(stagedFilters).filter(([key, value]) => {
        if (['page', 'limit', 'sortBy', 'sortOrder', 'search'].includes(key)) return false;
        const field = schema.fields.find(f => f.key === key);
        if (field?.type === 'select' && value === field.defaultValue) return false;
        if (typeof value === 'object' && value !== null) {
            return value.gte !== undefined || value.lte !== undefined;
        }
        return value !== undefined && value !== '' && value !== false;
    }).length;

    return (
        <div className="fixed inset-0 z-50 flex">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCancel}></div>

            <div className="ml-auto z-50 w-full max-w-md bg-white shadow-2xl flex flex-col h-full">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b">
                    <div>
                        <h2 className="text-xl font-bold">Filters</h2>
                        <div className="flex items-center gap-2 mt-1">
                            {activeFilterCount > 0 && (
                                <p className="text-sm text-gray-500">
                                    {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
                                </p>
                            )}
                            {changesCount > 0 && (
                                <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full">
                                    {changesCount} pending
                                </span>
                            )}
                        </div>
                    </div>
                    <button onClick={handleCancel} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {schema.sections.map((section) => {
                        const sectionFields = fieldsBySection[section];
                        if (!sectionFields?.length) return null;

                        return (
                            <div key={section} className="border rounded-lg overflow-hidden">
                                <button
                                    onClick={() => toggleSection(section)}
                                    className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100"
                                >
                                    <span className="font-semibold">{section}</span>
                                    {expandedSections.has(section) ? (
                                        <ChevronUp className="w-5 h-5" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5" />
                                    )}
                                </button>

                                {expandedSections.has(section) && (
                                    <div className="p-4 space-y-4 bg-white">
                                        {sectionFields.map((field) => (
                                            <div key={field.key}>{renderFilterField(field)}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="p-6 border-t bg-gray-50">
                    <div className="flex gap-3">
                        <button
                            onClick={handleResetFilters}
                            className="flex-1 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                        >
                            Reset All
                        </button>
                        <button
                            onClick={handleApplyFilters}
                            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                        >
                            Apply Filters
                            {changesCount > 0 && (
                                <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-blue-500 rounded-full">
                                    {changesCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}