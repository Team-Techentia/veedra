"use client";
import { useState, useEffect, useRef } from "react";
import { useDebouncedThrottle } from "@/hooks";
import { Search } from "lucide-react";

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export function SearchBar({ value, onChange, placeholder = "Search...", className = "", }: SearchBarProps) {
    const [input, setInput] = useState(value);
    const onChangeRef = useRef(onChange);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        setInput(value);
    }, [value]);

    // Debounce the input
    const debouncedValue = useDebouncedThrottle(input, 300, 300);

    // Call onChange only when debounced value changes AND is different from parent
    useEffect(() => {
        if (debouncedValue !== value) {
            onChangeRef.current(debouncedValue); // ✅ Use ref, not onChange directly
        }
    }, [debouncedValue, value]);

    return (
        <div className={`relative ${className}`}>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder={placeholder}
            />
        </div>
    );
}