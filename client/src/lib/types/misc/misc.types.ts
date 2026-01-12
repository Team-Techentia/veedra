import React from "react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterFieldConfig {
  key: string;
  label: string;
  type: "text" | "select" | "boolean" | "range" | "date" | "dateRange";
  options?: Array<{ value: string; label: string }>;
  rangeConfig?: {
    min: number;
    max: number;
    step: number;
    prefix?: string;
  };
  section: string; // For grouping in FilterSheet
  defaultValue?: any;
  placeholder?: string;
}

export type FilterParams = Record<string, any>;

export interface ColumnConfig<T> {
  key: string; // allow nested string keys
  label: string;
  sortable?: boolean;
  visible?: boolean;
  render?: (
    value: any,
    row: T,
    handlers?: {
      onView?: (row: T) => void;
      onEdit?: (row: T) => void;
      onDelete?: (row: T) => void;
      onApprove?: (row: T) => void;
      onReject?: (row: T) => void;
      onCancel?: (row: T) => void;
    }
  ) => React.ReactNode; // value can be any for nested keys
}

export interface StatsCardConfig {
  key: string; // nested path supported, e.g., "total.totalDeposits"
  title: string;
  icon: string; // Lucide icon string
  color: string;
  format?: (value: any) => string | React.ReactNode;
}

export interface FilterSchema<T = any> {
  fields: FilterFieldConfig[];
  sections: string[];
  defaultFilters: Record<string, any>;
  statsCards: StatsCardConfig[];
  tableColumns: ColumnConfig<T>[]; // generic type for table row
}

export type EntityType =
  | "product"
  // | "showcaseProduct";