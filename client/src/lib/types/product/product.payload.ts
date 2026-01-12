
// Payload Types for API requests
import { ProductBase } from "./product.types";

// Create Product (frontend → backend)
export type CreateProductPayload = Omit<
    ProductBase,
    "isDeleted" | "soldCount"
>;

export type UpdateProductPayload = Partial<CreateProductPayload>;

export interface BulkUpdateProductsPayload {
    productIds: string[];
    updateData: {
        isActive?: boolean;
        // status?: ProductStatus;
    };
}

export interface ProductFormErrors {
    productId?: string;          // SKU / business ID
    name?: string;
    description?: string;
    price?: number;
    stock?: number;
    isActive?: boolean;
}