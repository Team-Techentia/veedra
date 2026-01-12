"use client";
import { useEffect, useRef } from 'react';

export function useOutsideClick(ref: React.RefObject<HTMLElement | HTMLDivElement | HTMLButtonElement | null>,callback: () => void,active: boolean) {
  const ready = useRef(false);

  useEffect(() => {
    if (!active) return;

    const handleClick = (e: MouseEvent) => {
      if (ready.current && ref.current && !ref.current.contains(e.target as Node)) {
        callback();
      }
    };

    const timeout = setTimeout(() => (ready.current = true), 100); 

    document.addEventListener('mousedown', handleClick);
    return () => {
      clearTimeout(timeout);
      ready.current = false;
      document.removeEventListener('mousedown', handleClick);
    };
  }, [ref, callback, active]);
}