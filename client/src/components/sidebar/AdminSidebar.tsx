"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  PlusSquare,
  Folders,
  List,
  ShoppingBag,
  Users,
  ChevronDown,
  ListOrdered,
  User,
  Code,
  Wallet2,
  Settings,
} from "lucide-react";
import Image from "next/image";
import { ROUTES } from "@/lib/consts";
import { useEffect, useState } from "react";

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
}

const navItems = [
  { name: "Dashboard", href: ROUTES.ADMIN.ROOT, icon: LayoutDashboard },
  {
    name: "Products",
    icon: Package,
    children: [
      {
        name: "Add Product",
        href: ROUTES.ADMIN.PRODUCTS + "/add",
        icon: PlusSquare,
      },
      { name: "View Products", href: ROUTES.ADMIN.PRODUCTS, icon: List },
    ],
  },
  {
    name: "Product",
    icon: Package,
    children: [
      {
        name: "Add Product",
        href: ROUTES.ADMIN.PRODUCTS + "/add",
        icon: PlusSquare,
      },
      { name: "View Products", href: ROUTES.ADMIN.PRODUCTS, icon: List },
    ],
  },
  // { name: "Settings", href: ROUTES.ADMIN.SETTINGS, icon: Settings },
];

export function AdminSidebar({ collapsed, setCollapsed, }: SidebarProps) {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const toggleMenu = (name: string) => { setOpenMenu((prev) => (prev === name ? null : name)); };

  useEffect(() => {
    const parent = navItems.find((item) =>
      item.children?.some(
        (child) =>
          typeof child.href === "string" && pathname?.startsWith(child.href)
      )
    );
    if (parent) setOpenMenu(parent.name);
    else setOpenMenu(null);
  }, [pathname]);

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white text-[#4a5b7d] border-r border-gray-200 shadow-sm transition-all duration-300 ease-in-out z-50 ${collapsed ? "w-16" : "w-64"
        } flex flex-col`}
    >
      {/* Header - Fixed */}
      <div className="shrink-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div
            className={`transition-all duration-300 overflow-hidden ${collapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-40"
              }`}
          >
            <h2 className="text-lg font-semibold tracking-wide text-[#1f2a44]">
              Admin Panel
            </h2>
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
          >
            <Image
              src="/notebook.svg"
              alt="Toggle"
              width={22}
              height={22}
              className=""
            />
          </button>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden mt-4 px-2 no-scrollbar">
        <ul className="space-y-1 pb-4">
          {navItems.map(({ name, href, icon: Icon, children }) => {
            const isActive =
              pathname === href ||
              children?.some((child) => pathname === child.href);
            const isOpen = openMenu === name;

            return (
              <li
                key={name}
                className="relative"
                onMouseEnter={() => setHovered(name)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Parent */}
                {children ? (
                  <button
                    data-nav-item={name}
                    onClick={() => !collapsed && toggleMenu(name)}
                    className={`w-full flex items-center rounded-md px-3 py-2 transition-all duration-200 ${isActive
                      ? "bg-[#34a874] text-white font-medium"
                      : "hover:bg-gray-50 text-[#4a5b7d]"
                      }`}
                  >

                    <Icon size={22} className="shrink-0" />
                    <div className="flex justify-between items-center w-full">
                      <span
                        className={`ml-3 transition-all duration-300 ${collapsed
                          ? "opacity-0 max-w-0"
                          : "opacity-100 max-w-45"
                          }`}
                      >
                        {name}
                      </span>
                      {!collapsed && (
                        <ChevronDown
                          size={14}
                          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""
                            }`}
                        />
                      )}
                    </div>
                  </button>
                ) : (
                  <Link
                    href={href!}
                    className={`flex items-center rounded-md px-3 py-2 transition-all duration-200 ${isActive
                      ? "bg-[#34a874] text-white font-medium"
                      : "hover:bg-gray-50 text-[#4a5b7d]"
                      }`}
                  >
                    <Icon size={22} className="shrink-0" />
                    <span
                      className={`ml-3 transition-all duration-300 ${collapsed
                        ? "opacity-0 max-w-0"
                        : "opacity-100 max-w-45"
                        }`}
                    >
                      {name}
                    </span>
                  </Link>
                )}

                {/* Expanded children */}
                {!collapsed && isOpen && children && (
                  <ul className="ml-7 mt-1 space-y-1">
                    {children.map((child) => (
                      <li key={child.name}>
                        <Link
                          href={child.href}
                          className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-all duration-200 ${pathname ===
                            (typeof child.href === "string"
                              ? child.href
                              : "/")
                            ? "bg-[#34a874] text-white font-medium"
                            : "hover:bg-gray-50 text-[#4a5b7d]"
                            }`}
                        >
                          <child.icon size={18} />
                          <span>{child.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Floating submenu (collapsed) - positioned relative to viewport */}
                {collapsed && hovered === name && children && (
                  <div
                    className="fixed left-14 bg-white border border-gray-200 rounded-lg shadow-lg w-52 py-2 z-60 ml-2"
                    style={{
                      top: `${document.querySelector(`[data-nav-item="${name}"]`)?.getBoundingClientRect().top || 0}px`
                    }}
                  >
                    {children.map((child) => (
                      <Link
                        key={child.name}
                        href={child.href}
                        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors duration-200 ${pathname ===
                          (typeof child.href === "string"
                            ? child.href
                            : "/")
                          ? "bg-[#34a874] text-white font-medium"
                          : "text-[#4a5b7d] hover:bg-gray-50"
                          }`}
                      >
                        <child.icon size={18} />
                        <span>{child.name}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer - Fixed at bottom */}
      <div
        className={`shrink-0 text-xs text-[#7b8aab] px-4 py-3 border-t border-gray-100 transition-all duration-300 ${collapsed ? "opacity-0" : "opacity-100"
          }`}
      >
        © QuickZon 2025
      </div>
    </aside>
  );
}