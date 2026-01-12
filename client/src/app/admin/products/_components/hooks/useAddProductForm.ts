// @/app/admin/products/_components/hooks/useAddProductForm.ts
import { useState, useCallback, useMemo } from "react";
import { CreateProductPayload, ProductFormErrors, } from "@/lib/types";

interface ImageFile {
  file: File;
  preview: string;
  isMain: boolean;
}

const defaultCreateForm: CreateProductPayload = { name: "", description: "", stock: 0, productId: "", isActive: true, price: 0 };

export function useCreateProductForm() {
  const [formData, setFormData] = useState<CreateProductPayload>(defaultCreateForm);
  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);

  const generateSlug = (name: string) => name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  const updateField = (field: keyof CreateProductPayload, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Type-safe error clearing - skip variants as it has special structure
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let processedValue: any = value;

    if (type === "number") processedValue = value === "" ? null : Number(value);
    if (type === "checkbox")
      processedValue = (e.target as HTMLInputElement).checked;

    updateField(name as keyof CreateProductPayload, processedValue);
  };

  // Validate file type
  const validateFileType = (file: File): boolean => {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    return allowedTypes.includes(file.type);
  };

  // Validate file size (default 5MB)
  const validateFileSize = (file: File, maxSizeMB: number = 5): boolean => {
    const maxSize = maxSizeMB * 1024 * 1024;
    return file.size <= maxSize;
  };

  // Add image files (for preview only, not uploaded yet)
  // const handleAddImageFiles = useCallback(
  //   (files: File[]) => {
  //     const validFiles: ImageFile[] = [];
  //     const invalidFiles: string[] = [];

  //     files.forEach((file) => {
  //       if (!validateFileType(file)) {
  //         invalidFiles.push(`${file.name}: Invalid file type`);
  //         return;
  //       }
  //       if (!validateFileSize(file, 5)) {
  //         invalidFiles.push(`${file.name}: File size exceeds 5MB`);
  //         return;
  //       }

  //       // Create preview URL
  //       const preview = URL.createObjectURL(file);
  //       validFiles.push({ file, preview, isMain: false });
  //     });

  //     if (invalidFiles.length > 0) {
  //       console.warn("Invalid files:", invalidFiles);
  //     }

  //     setImageFiles((prev) => {
  //       const newFiles = [...prev, ...validFiles];
  //       // Set first image as main if no main image exists
  //       if (newFiles.length > 0 && !newFiles.some((f) => f.isMain)) {
  //         newFiles[0].isMain = true;
  //       }
  //       return newFiles;
  //     });

  //     // Clear any image errors
  //     if (errors.images) {
  //       setErrors((prev) => ({ ...prev, images: undefined }));
  //     }
  //   },
  //   [errors.images]
  // );

  // Remove image file
  const handleRemoveImageFile = useCallback((preview: string) => {
    setImageFiles((prev) => {
      const filtered = prev.filter((img) => img.preview !== preview);

      // Revoke object URL to free memory
      URL.revokeObjectURL(preview);

      // If removed image was main, set new main
      if (filtered.length > 0 && !filtered.some((f) => f.isMain)) {
        filtered[0].isMain = true;
      }

      return filtered;
    });
  }, []);

  // Set main image
  const handleSetMainImage = useCallback((preview: string) => {
    setImageFiles((prev) =>
      prev.map((img) => ({ ...img, isMain: img.preview === preview }))
    );
  }, []);

  // Get files ready for upload (returns in order: main image first, then others)
  const getFilesForUpload = useCallback((): File[] => {
    const mainImage = imageFiles.find((img) => img.isMain);
    const otherImages = imageFiles.filter((img) => !img.isMain);

    return [
      ...(mainImage ? [mainImage.file] : []),
      ...otherImages.map((img) => img.file),
    ];
  }, [imageFiles]);

  // Handle arrays (comma separated)
  // const handleArrayChange = (
  //   field: "tags" | "searchKeywords",
  //   value: string
  // ) => {
  //   const array = value
  //     .split(",")
  //     .map((item) => item.trim())
  //     .filter(Boolean);
  //   updateField(field, array);
  // };

  const validateForm = (): boolean => {
    const newErrors: ProductFormErrors = {};

    // ------------------ Product validations ------------------
    if (!formData.name?.trim()) newErrors.name = "Product name is required";
    else if (formData.name.length < 2)
      newErrors.name = "Product name must be at least 2 characters";
    else if (formData.name.length > 200)
      newErrors.name = "Product name cannot exceed 200 characters";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData(defaultCreateForm);
    setErrors({});

    // Revoke all object URLs to free memory
    imageFiles.forEach((img) => URL.revokeObjectURL(img.preview));
    setImageFiles([]);
  };

  return {
    formData,
    errors,
    imageFiles,
    updateField,
    handleChange,
    // handleArrayChange,
    validateForm,
    resetForm,

    // Image file management (preview only)
    // handleAddImageFiles,
    handleRemoveImageFile,
    handleSetMainImage,
    getFilesForUpload,
    generateSlug,

    // Validation helpers
    validateFileType,
    validateFileSize,
  };
}
