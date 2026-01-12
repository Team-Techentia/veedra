"use client";
import { useEffect, useState } from "react";

export function useResize() {
    const [collapsed, setCollapsed] = useState(true);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 786) {
                setCollapsed(true);
            } else {
                setCollapsed(true);
            }
        };
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [])

    return { collapsed, setCollapsed };
}