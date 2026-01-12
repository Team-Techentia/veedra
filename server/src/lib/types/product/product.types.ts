// lib/types/product/product.types.ts
import mongoose, { Document, Model } from "mongoose";

export interface IProductCategoryRef {
  categoryId: string; // business categoryId
  primary: boolean;
}

// ---------------- Base Interface ----------------
export interface IProduct {
  orgId: mongoose.Types.ObjectId;

  productId: string; // business identifier (stable ID)
  sku: string; // unique per org (non-deleted)

  name: string;
  description?: string;
  brand?: string;

  hsn?: string;
  defaultGstRate?: number;

  categories: IProductCategoryRef[];

  attributes: Record<string, any>; // size, color, fabric
  tags: string[];

  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date;

  createdBy?: mongoose.Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}

// ---------------- Document Interface ----------------
export interface IProductDocument extends IProduct, Document {
  markInactive(): Promise<IProductDocument>;
  markActive(): Promise<IProductDocument>;
  softDelete(): Promise<IProductDocument>;
  setPrimaryCategory(categoryId: string): Promise<IProductDocument>;

  statusLabel: string; // virtual
}

// ---------------- Model Interface ----------------
export interface IProductModel extends Model<IProductDocument> {
  findActiveOne(orgId: mongoose.Types.ObjectId, productId: string): Promise<IProductDocument | null>;
  findBySku(orgId: mongoose.Types.ObjectId, sku: string): Promise<IProductDocument | null>;
  findOrgProducts(orgId: mongoose.Types.ObjectId): Promise<IProductDocument[]>;
  findActiveOrgProducts(orgId: mongoose.Types.ObjectId): Promise<IProductDocument[]>;
}