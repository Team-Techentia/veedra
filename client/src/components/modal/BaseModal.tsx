"use client";
import { useOutsideClick } from '@/hooks';
import React, { useEffect, useRef } from 'react'

interface BaseModalProps {
    isOpen: boolean;
    closeModal: () => void;
    children: React.ReactNode;
    className?: string;
};

export function BaseModal({ isOpen, closeModal, children, className = "" }: BaseModalProps) {

    const modalRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : "";
        return () => { document.body.style.overflow = "" };
    }, [isOpen]);

    useOutsideClick(modalRef, closeModal, isOpen)

    if (!isOpen) return null;

    return (
        <div className="no-scrollbar fixed inset-0 z-[1000] bg-black/30 flex justify-center items-center">
            <div ref={modalRef} className={`relative ${className} no-scrollbar rounded-lg overflow-hidden`}>
                {children}
            </div>
        </div>
    );
}
