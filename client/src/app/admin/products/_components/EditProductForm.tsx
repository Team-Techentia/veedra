"use client";

import React, { useRef, useState } from "react";
import { Save, Upload, X, Star, Image as ImageIcon } from "lucide-react";
import {
    FormInput, FormSelect, FormTextArea, FormCheckbox, FormGrid, FormSubmitButton, FormCancelButton, FormActions,
} from "@/components";
import { useProduct } from "@/hooks";
import { useEditProductForm } from "./hooks/useEditProductForm";

export function EditProductForm({ productId }: { productId: string }) {
    const {
        loading,
        formData,
        setFormData,
        errors,
        setErrors,

        // data
        selectedParentCategory,

        // helpers
        updateField,
        handleChange,

        // images
        imageFiles,
    } = useEditProductForm(productId);

    // const { uploadBulk, isUploadingBulk } = useImageUpload();
    const { updateProduct } = useProduct();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (loading || !formData) {
        return <div className="text-center py-10 text-gray-500">Loading product...</div>;
    }

    const isFormLoading = isSubmitting;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            // handleAddImageFiles(files);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // upload only new files
            // const toUpload = getFilesForUpload();
            // let newUrls: string[] = [];
            // if (toUpload.length > 0) {
            //     const uploaded = await uploadBulk(toUpload);
            //     newUrls = (uploaded || []).map((u: any) => u.url);
            // }

            // const { images, mainImage } = getFinalImageUrls(newUrls);

            const payload = {
                ...formData,
                // images,
                // mainImage,
            };

            await updateProduct(productId, payload);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-xl w-[95%] max-w-6xl mx-auto p-6">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">Edit Product</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                    <FormGrid cols={2}>
                        <FormInput
                            label="Product Name"
                            name="name"
                            required
                            value={formData.name ?? ""}
                            onChange={(e) => updateField("name", e.target.value)}
                            error={errors.name}
                            placeholder="Enter product name"
                            disabled={isFormLoading}
                        />
                        {/* <FormInput
                            label="Slug"
                            name="slug"
                            required
                            value={formData.slug ?? ""}
                            onChange={(e) => updateField("slug", e.target.value)}
                            error={errors.slug}
                            placeholder="product-slug"
                            disabled={isFormLoading}
                        /> */}
                    </FormGrid>
                </div>

                {/* Product Images */}
                <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Product Images</h3>

                    {/* Upload Button */}
                    <div className="mb-4">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isFormLoading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
                        >
                            <Upload className="w-4 h-4" />
                            Select Images
                        </button>
                        <p className="text-sm text-gray-500 mt-2">
                            Add new images if needed. Existing images stay unless removed.
                        </p>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={isFormLoading}
                    />
                </div>

                <FormActions>
                    <FormCancelButton
                        onClick={() => {
                            // reset to server-loaded values
                            setErrors({});
                            // optional: reload product here if desired
                            window.location.reload();
                        }}
                        disabled={isFormLoading}
                    >
                        Reset
                    </FormCancelButton>
                    <FormSubmitButton
                        isLoading={isFormLoading}
                        loadingText={
                            // isUploadingBulk ? "Uploading images..." : 
                            isSubmitting ? "Updating product..." : "Processing..."
                        }
                        icon={<Save className="w-4 h-4" />}
                    >
                        Update Product
                    </FormSubmitButton>
                </FormActions>
            </form>
        </div>
    );
}
