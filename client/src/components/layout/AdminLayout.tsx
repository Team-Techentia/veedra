'use client';
import { AdminSidebar, AdminNavbar, ToastProvider as Toaster } from '@/components';
import { useAuth, useResize } from '@/hooks';

export function AdminLayout({ children }: { children: React.ReactNode }) {
    const { collapsed, setCollapsed } = useResize();

    const { } = useAuth();

    return (
        <>
            <AdminSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
            <Toaster />
            <div className={`flex flex-col transition-all duration-300 h-screen ${collapsed ? 'ml-16.25' : 'md:ml-64'}`}>
                <AdminNavbar collapsed={collapsed} />
                <main className="px-4 pt-17.5 bg-red-60 h-full">{children}</main>
            </div>
        </>
    );
}
