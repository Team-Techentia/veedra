"use client";

import React, { useState } from "react";
import { AdminLayout } from "@/components";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export default function AdminRootLayout({ children, }: { children: React.ReactNode; }) {
    const [queryClient] = useState(() => new QueryClient());

    return (
        <QueryClientProvider client={queryClient}>
            <AdminLayout>
                {children}
            </AdminLayout>
        </QueryClientProvider>
    );
}