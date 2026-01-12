import { BreadcrumbItem } from "@/lib/types";
import { ChevronRight } from "lucide-react";
import React from "react";

// Reusable Breadcrumbs Component
interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center space-x-2 text-sm px-6 py-3 border-b">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <div className="flex items-center">
            {item.icon && <item.icon className="w-4 h-4 mr-1" />}
            {item.href ? (
              <a
                href={item.href}
                className="hover:text-gray-300 transition-colors"
              >
                {item.label}
              </a>
            ) : (
              <span
                className={
                  index === items.length - 1 ? "font-medium" : ""
                }
              >
                {item.label}
              </span>
            )}
          </div>
          {index < items.length - 1 && (
            <ChevronRight className="w-4 h-4 text-gray-300" />
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
