"use client";

import Image from "next/image";
import { LogOut, User2 } from "lucide-react";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useOutsideClick } from "@/hooks";

export function AdminNavbar({ collapsed }: { collapsed: boolean }) {
  const { user, logout, isLoading } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useOutsideClick(dropdownRef, () => setShowDropdown(false), showDropdown);

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
  };

  return (
    <nav
      className={`fixed top-0 right-0 h-16 px-6 py-3 bg-white border-b border-gray-200 shadow-sm z-30 transition-all duration-300 ${
        collapsed ? "left-16" : "md:left-64"
      }`}
    >
      <div className="w-full flex items-center justify-between gap-4">
        {/* Left - Logo */}
        <div className="w-12 h-10 relative">
          <Image
            src="/logo1.png"
            alt="Logo"
            fill
            priority
            className="object-contain"
          />
        </div>

        {/* Right - User */}
        <div className="flex items-center gap-4">
          {/* Avoid rendering until auth is resolved */}
          {!isLoading && user && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown((prev) => !prev)}
                className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-700">
                  <User2 size={18} />
                </div>
                <span className="text-gray-800 font-medium hidden md:block">
                  {user.firstName}
                </span>
              </button>

              {/* Dropdown */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <p className="text-gray-800 font-semibold text-sm">
                      {user.fullName}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      {user.email}
                    </p>

                    {user.isAdmin && (
                      <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-600 text-xs rounded-full">
                        Admin
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="py-2">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition-colors text-left group"
                    >
                      <LogOut className="w-4 h-4 text-red-500 group-hover:text-red-600" />
                      <span className="text-red-500 text-sm group-hover:text-red-600">
                        Logout
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
