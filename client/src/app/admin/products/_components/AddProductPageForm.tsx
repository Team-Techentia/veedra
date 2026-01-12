"use client";
import React, { useRef, useState } from "react";
import { Save, Upload, X, Star, Image as ImageIcon } from "lucide-react";
import { CreateProductPayload, } from "@/lib/types";
import { FormInput, FormSelect, FormTextArea, FormCheckbox, FormGrid, FormSubmitButton, FormCancelButton, FormActions, } from "@/components";
import { useCreateProductForm } from "./hooks/useAddProductForm";
import { useProduct } from "@/hooks";
import toast from "react-hot-toast";
import Image from "next/image";

export function AddProductForm() {
  const {
    formData,
    errors,
    imageFiles,
    handleChange,
    validateForm,
    resetForm,
    handleRemoveImageFile,
    handleSetMainImage,
    getFilesForUpload,
    updateField,
    generateSlug,
  } = useCreateProductForm();

  const { createProduct } = useProduct();

  // const { uploadBulk, isUploadingBulk } = useImageUpload();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);console.log(errors)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = validateForm();
    if (!isValid) {
      // toast.error("Please fix validation errors");
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Upload images
      const filesToUpload = getFilesForUpload();
      if (filesToUpload.length === 0) {
        toast.error("Please select at least one image");
        setIsSubmitting(false);
        return;
      }

      // const uploadResponse = await uploadBulk(filesToUpload);
      // toast.dismiss("upload");

      // const uploadedImages = uploadResponse || [];

      // if (!uploadedImages.length) {
      //   throw new Error("Failed to upload images");
      // }

      // // Step 2: Extract URLs from uploaded images
      // const imageUrls = uploadedImages.map((img: any) => img.url);
      // const mainImageUrl = imageUrls[0]; // first image = main

      // Step 3: Prepare product data
      const productData: CreateProductPayload = {
        ...formData,
        // images: imageUrls,
        // mainImage: mainImageUrl,
      };

      // Step 4: Create product
      toast.loading("Creating product...", { id: "submit" });

      const res = await createProduct(productData);

      if (!res?._id) {
        return;
      }
      resetForm();
    } catch (err) {
      toast.dismiss("upload");
    } finally {
      toast.dismiss("submit");
      setIsSubmitting(false);
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      // handleAddImageFiles(files);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const isFormLoading = isSubmitting;

  return (
    <div className="bg-white rounded-lg shadow-xl w-[95%] max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">
          Add New Product
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Basic Information
          </h3>
          <FormGrid cols={2}>
            <FormInput
              label="Product Name"
              name="name"
              required
              value={formData.name}
              onChange={(e) => {
                const nameValue = e.target.value;
                updateField("name", nameValue);

                const currentAutoSlug = generateSlug(nameValue);

                // if (
                //   !formData.slug ||
                //   formData.slug === generateSlug(formData.name)
                // ) {
                //   updateField("slug", currentAutoSlug);
                // }
              }}
              error={errors.name}
              placeholder="Enter product name"
              disabled={isFormLoading}
            />
            {/* <FormInput
              label="Slug"
              name="slug"
              required
              value={formData.slug}
              onChange={handleChange}
              error={errors.slug}
              placeholder="product-slug"
              disabled={isFormLoading}
            />
            <FormSelect
              label="Brand"
              name="brandId"
              value={formData.brandId ?? ""}
              onChange={(e) => updateField("brandId", e.target.value)}
              error={errors.brandId}
              options={[
                { value: "", label: "-- Select Brand --" },
                ...brands.map((brand) => ({
                  value: brand._id,
                  label: brand.name,
                })),
              ]}
              disabled={isFormLoading}
            />
            <FormSelect
              label="Product Type"
              name="productType"
              value={formData.productType}
              onChange={handleChange}
              error={errors.productType}
              options={[
                { value: "VEG", label: "🌱 Vegetarian" },
                { value: "NON_VEG", label: "🍖 Non-Vegetarian" },
                { value: "NONE", label: "Not Applicable" },
              ]}
              disabled={isFormLoading}
            />
            <FormSelect
              label="Category"
              name="parentCategory"
              required
              value={selectedParentCategory}
              onChange={handleParentCategoryChange}
              error={errors.categoryId}
              options={[
                { value: "", label: "-- Select Category --" },
                ...parentCategories.map((cat) => ({ value: cat._id, label: cat.name, })),
              ]}
              disabled={isFormLoading}
            /> */}

            {/* Replace the manual Subcategory select with this */}
            {/* <FormSelect
              label="Subcategory"
              name="subcategory"
              required
              value={formData.categoryId ?? ""}
              onChange={handleSubCategoryChange}
              error={errors.categoryId}
              options={[
                { value: "", label: "-- Select Subcategory --" },
                ...subCategories.map((subCat) => ({ value: subCat._id, label: subCat.name, })),
              ]}
              disabled={isFormLoading}
            /> */}
          </FormGrid>
        </div>

        {/* Product Images */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Product Images
          </h3>

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
              Select one or multiple images. Images will be uploaded when you
              create the product.
            </p>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            multiple
            onChange={handleFileChange}
            className="hidden"
            disabled={isFormLoading}
          />

          {/* Image Preview Gallery */}
          {imageFiles.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {imageFiles.map((imageFile, index) => (
                <div
                  key={imageFile.preview}
                  className={`relative group border-2 rounded-lg overflow-hidden ${imageFile.isMain
                    ? "border-yellow-500 ring-2 ring-yellow-500"
                    : "border-gray-200"
                    }`}
                >
                  <Image
                    src={imageFile.preview}
                    width={256}
                    height={160}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-40 object-cover"
                  />

                  {/* Main Image Badge */}
                  {imageFile.isMain && (
                    <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1">
                      <Star className="w-3 h-3 fill-white" />
                      Main
                    </div>
                  )}

                  {/* File Info Badge */}
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded-md text-xs">
                    {(imageFile.file.size / 1024 / 1024).toFixed(2)} MB
                  </div>

                  {/* Action Buttons */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    {!imageFile.isMain && (
                      <button
                        type="button"
                        onClick={() => handleSetMainImage(imageFile.preview)}
                        className="px-3 py-1 bg-yellow-500 text-white rounded-md text-sm hover:bg-yellow-600 flex items-center gap-1"
                        disabled={isFormLoading}
                      >
                        <Star className="w-3 h-3" />
                        Set Main
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImageFile(imageFile.preview)}
                      className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                      title="Remove image"
                      disabled={isFormLoading}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500 font-medium">No images selected</p>
              <p className="text-sm text-gray-400 mt-1">
                Click the button above to select product images
              </p>
            </div>
          )}

          {/* {errors.images && (
            <p className="text-red-500 text-sm mt-2">{errors.images}</p>
          )}

          {imageFiles.length > 0 && (
            <p className="text-sm text-gray-600 mt-3">
              📸 {imageFiles.length} image{imageFiles.length > 1 ? "s" : ""}{" "}
              selected • Will be uploaded when you create the product
            </p>
          )} */}
        </div>

        {/* Tags & Keywords */}
        {/* <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Tags & Keywords
          </h3>
          <FormGrid cols={1}>
            <FormTextArea
              label="Search Keywords (comma-separated)"
              name="searchKeywords"
              value={formData.searchKeywords?.join(", ") ?? ""}
              onChange={(e) =>
                handleArrayChange("searchKeywords", e.target.value)
              }
              rows={2}
              placeholder="keyword1, keyword2, keyword3"
              error={errors.searchKeywords}
              disabled={isFormLoading}
            />
          </FormGrid>
        </div> */}

        {/* Product Policies */}
        {/* <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Product Policies
          </h3>
          <FormGrid cols={3}>
            <FormCheckbox
              label="Returnable"
              name="isReturnable"
              checked={formData.isReturnable ?? false}
              onChange={handleChange}
              disabled={isFormLoading}
            />
          </FormGrid>
        </div> */}

        <FormActions>
          <FormCancelButton onClick={resetForm} disabled={isFormLoading}>
            Reset
          </FormCancelButton>
          <FormSubmitButton
            isLoading={isFormLoading}
            loadingText={
              // isUploadingBulk
              //   ? "Uploading images..."
              //   :
                 isSubmitting
                  ? "Creating product..."
                  : "Processing..."
            }
            icon={<Save className="w-4 h-4" />}
          >
            Create Product
          </FormSubmitButton>
        </FormActions>
      </form>
    </div>
  );
}
