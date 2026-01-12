"use client";
import { useState, useEffect, useRef } from 'react';

export function useDebouncedThrottle<T>(value: T, delay = 300, throttle = 0) {
    const timeout = useRef<number | null>(null);
    const lastRun = useRef<number>(0);
    const [output, setOutput] = useState(value);

    useEffect(() => {
        const handler = () => {
            const now = Date.now();
            if (throttle && now - lastRun.current < throttle) {
                timeout.current = window.setTimeout(handler, throttle - (now - lastRun.current));
            } else {
                lastRun.current = now;
                setOutput(value);
            }
        };

        if (timeout.current) {
            clearTimeout(timeout.current);
        }
        timeout.current = window.setTimeout(handler, delay);

        return () => {
            if (timeout.current) {
                clearTimeout(timeout.current);
            }
        };
    }, [value, delay, throttle]);

    return output;
}
