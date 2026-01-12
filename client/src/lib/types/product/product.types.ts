// @/lib/types/product/product.types.ts

import { ProductStatus } from "./product.enums";

// Base Variant Type (matches backend schema)
export interface ProductBase {
  productId: string;          // SKU / business ID
  name: string;
  description?: string;
  price: number;
  stock: number;
  isActive: boolean;
  userId: string;
}

// Product Type for API responses
export interface ProductType extends Omit<ProductBase, "userId"> {
  _id: string;
  soldCount: number;
  status: ProductStatus;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  __v?: number;
  userId: {
    name: string;
    
  }

  // convenience alias added by backend
  id?: string;
}