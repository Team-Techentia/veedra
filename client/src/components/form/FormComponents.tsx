// @/components/FormComponents.tsx
import React from 'react';

// Base styling constants
const inputBaseClasses =
  "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 disabled:hover:bg-gray-100";

const inputNormalClasses = "border-gray-300";
const inputErrorClasses = "border-red-300 focus:border-red-500";


// FormInput Component
interface FormInputProps {
  label: string;
  name: string;
  type?: 'text' | 'number' | 'email' | 'password' | "date";
  value: string | number | null;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  disabled?: boolean;
  className?: string;
  readOnly?: boolean;
}

export function FormInput({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error,
  min,
  max,
  step,
  disabled = false,
  className = "",
  readOnly = false,
}: FormInputProps) {
  const inputClasses = `${inputBaseClasses} ${error ? inputErrorClasses : inputNormalClasses} ${className}`;

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        value={value ?? ''}
        onChange={onChange}
        className={inputClasses}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        disabled={disabled || readOnly}
        readOnly={readOnly}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
          }
        }}
        onWheel={(e) => e.currentTarget.blur()}
        onMouseDown={(e) => {
          if ((e.target as HTMLElement).tagName === "INPUT") return;
          e.preventDefault();
        }}
        onMouseMove={(e) => {
          e.preventDefault();
        }}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

// FormSelect Component
interface FormSelectProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export function FormSelect({
  label,
  name,
  value,
  onChange,
  options,
  required = false,
  error,
  disabled = false,
  className = "",
}: FormSelectProps) {
  const selectClasses = `${inputBaseClasses} ${error ? inputErrorClasses : inputNormalClasses} ${className} !h-8 !overflow-hidden`;

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className={selectClasses}
        disabled={disabled}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

// FormTextArea Component
interface FormTextAreaProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  rows?: number;
  disabled?: boolean;
  className?: string;
}

export function FormTextArea({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  rows = 3,
  disabled = false,
  className = "",
}: FormTextAreaProps) {
  const textAreaClasses = `${inputBaseClasses} ${error ? inputErrorClasses : inputNormalClasses} ${className}`;

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
        className={textAreaClasses}
        placeholder={placeholder}
        disabled={disabled}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

// FormCheckbox Component
interface FormCheckboxProps {
  label: string;
  name: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export function FormCheckbox({
  label,
  name,
  checked,
  onChange,
  required = false,
  error,
  disabled = false,
  className = "",
}: FormCheckboxProps) {
  return (
    <div className={className}>
      <div className="flex items-center">
        <input
          type="checkbox"
          id={name}
          name={name}
          checked={checked}
          onChange={onChange}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          disabled={disabled}
        />
        <label htmlFor={name} className="ml-2 text-sm text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

// FormGrid Component
interface FormGridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3;
  className?: string;
}

export function FormGrid({ children, cols = 2, className = "" }: FormGridProps) {
  const gridClasses = {
    1: 'grid grid-cols-1 gap-4',
    2: 'grid grid-cols-1 md:grid-cols-2 gap-4',
    3: 'grid grid-cols-1 md:grid-cols-3 gap-4',
  };

  return (
    <div className={`${gridClasses[cols]} ${className}`}>
      {children}
    </div>
  );
}

// FormSubmitButton Component
interface FormSubmitButtonProps {
  children: React.ReactNode;
  isLoading?: boolean;
  loadingText?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export function FormSubmitButton({
  children,
  isLoading = false,
  loadingText = 'Loading...',
  disabled = false,
  icon,
  className = "",
}: FormSubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={disabled || isLoading}
      className={`flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isLoading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          {loadingText}
        </>
      ) : (
        <>
          {icon && <span className="mr-2">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}

// FormCancelButton Component
interface FormCancelButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export function FormCancelButton({
  children,
  onClick,
  disabled = false,
  className = ""
}: FormCancelButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

// FormActions Component
interface FormActionsProps {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export function FormActions({
  children,
  className = "",
  align = 'right'
}: FormActionsProps) {
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  };

  return (
    <div className={`flex ${alignClasses[align]} space-x-3 pt-4 ${className}`}>
      {children}
    </div>
  );
}