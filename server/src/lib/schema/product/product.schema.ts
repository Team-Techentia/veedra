import { z } from "zod";

export const productSchema = {
    // ---------------- Create ----------------
    createProductSchema: z.object({
        productId: z.string().min(3, "Product ID must be at least 3 characters").max(50, "Product ID cannot exceed 50 characters"),
        name: z.string().min(2, "Product name must be at least 2 characters").max(200, "Product name cannot exceed 200 characters"),
        description: z.preprocess(
            (val) => (val === "" || val === null || val === undefined ? undefined : val),
            z.string().max(2000, "Description cannot exceed 2000 characters").optional()
        ),
        price: z.number().min(0, "Price must be a positive number"),
        stock: z.preprocess(
            (val) => (val === "" || val === null || val === undefined ? 0 : val),
            z.number().int("Stock must be an integer").min(0, "Stock cannot be negative")
        ),
    }),

    // ---------------- Update ----------------
    updateProductSchema: z.object({
        name: z.string().min(2, "Product name must be at least 2 characters").max(200, "Product name cannot exceed 200 characters").optional(),
        description: z.string().max(2000, "Description cannot exceed 2000 characters").optional(),
        price: z.number().min(0, "Price must be a positive number").optional(),
        stock: z.number().int("Stock must be an integer").min(0, "Stock cannot be negative").optional(),
        isActive: z.boolean().optional(),
    }),

    // ---------------- Params ----------------
    productIdSchema: z.object({
        id: z.string().min(3, "Product ID must be at least 3 characters").max(50, "Product ID cannot exceed 50 characters"),
    }),

    // ---------------- Bulk Actions ----------------
    bulkProductActionSchema: z.object({
        productIds: z.array(z.string().min(3).max(50)).min(1, "At least one product ID is required").max(50, "Cannot perform bulk action on more than 50 products"),
        action: z.enum(["activate", "deactivate", "delete"]),
    }),
};

// ---------------- Type Exports ----------------
export type CreateProductRequest = z.infer<typeof productSchema.createProductSchema>;
export type UpdateProductRequest = z.infer<typeof productSchema.updateProductSchema>;
export type ProductIdRequest = z.infer<typeof productSchema.productIdSchema>;
export type BulkProductActionRequest = z.infer<typeof productSchema.bulkProductActionSchema>;