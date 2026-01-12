import React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = {
  variant: {
    primary: "bg-green-600 text-white hover:bg-green-700",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
    outline: "border border-green-600 text-green-600 hover:bg-green-50",
    danger: "bg-red-500 text-white hover:bg-red-600",
    hero: "bg-[#009688] text-white hover:bg-[#00796B]",
  },
  size: {
    sm: "text-sm px-3 py-1.5 rounded-md",
    md: "text-base px-4 py-2 rounded-lg",
    lg: "text-lg px-6 py-3 rounded-xl",
  },
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants.variant;
  size?: keyof typeof buttonVariants.size;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  className,
  isLoading,
  children,
  ...props
}) => {
  return (
    <button
      className={cn(
        "font-semibold flex items-center justify-center transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed",
        buttonVariants.variant[variant],
        buttonVariants.size[size],
        className
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && (
        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
      )}
      {isLoading ? "Processing..." : children}
    </button>
  );
};
