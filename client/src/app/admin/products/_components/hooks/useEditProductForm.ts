"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
    UpdateProductPayload,
    ProductFormErrors,
    ProductEatableType,
    ProductStatus,
    VariantInventoryType,
    VariantQuantityType,
    VariantStatus,
} from "@/lib/types";
import { useProduct, } from "@/hooks";

interface ImageFile {
    file?: File;
    preview: string;   // url or objectURL
    isMain: boolean;
    uploaded?: boolean; // true if already stored on server
}

export function useEditProductForm(productId: string) {
    const { getProductById } = useProduct();
    const [formData, setFormData] = useState<UpdateProductPayload | null>(null);
    const [errors, setErrors] = useState<ProductFormErrors>({});
    const [loading, setLoading] = useState(true);

    const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);
    const [selectedParentCategory, setSelectedParentCategory] = useState("");

    // load product
    useEffect(() => {
        (async () => {
            setLoading(true);
            const p = await getProductById(productId);
            if (!p) {
                setLoading(false);
                return;
            }

            // normalize brand & category
            const normalized: UpdateProductPayload = {
                ...p,
            };

            setFormData(normalized);

            setLoading(false);
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productId,]);

    // helpers
    const updateField = (field: keyof UpdateProductPayload, value: any) => {
        setFormData((prev) => (prev ? { ...prev, [field]: value } : prev));
        if (errors[field]) {
            setErrors((e) => {
                const ne = { ...e };
                delete ne[field];
                return ne;
            });
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value, type } = e.target;
        let processed: any = value;
        if (type === "checkbox") processed = (e.target as HTMLInputElement).checked;
        if (type === "number") processed = value === "" ? null : Number(value);
        updateField(name as keyof UpdateProductPayload, processed);
    };

    return {
        loading,
        formData,
        setFormData,
        errors,
        setErrors,

        // brands and categories
        selectedParentCategory,

        // field helpers
        updateField,
        handleChange,

        // images
        imageFiles,
    }
}