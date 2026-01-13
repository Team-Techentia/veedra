import mongoose, { Document, Model } from "mongoose";

export type TProductStatus = "ACTIVE" | "INACTIVE";

export interface IProductImage {
  url: string;
  publicId?: string; // (optional) if using cloudinary later
}

export interface IProductPricing {
  factoryPrice: number;

  // Auto-rule calculated fields
  mrp: number;
  offerPrice: number;

  gstPercent: number;

  // If true → allow manual override in create/update
  allowOverride: boolean;

  lastCalculatedAt?: Date;
}

export interface IProduct {
  orgId: mongoose.Types.ObjectId;

  productId: string; // business id
  name: string;

  // ✅ Separate entities
  categoryId: mongoose.Types.ObjectId;       // ref Category
  subCategoryId?: mongoose.Types.ObjectId;   // ref SubCategory (optional)

  size?: string;
  color?: string;
  brand?: string;
  gender?: "MENS" | "LADIES";

  hsnCode?: string;

  // unique per org
  barcode: string;
  sku: string;

  images: IProductImage[];

  pricing: IProductPricing;

  status: TProductStatus;

  createdBy: mongoose.Types.ObjectId;

  isDeleted: boolean;
  deletedAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

// ---------------- Document Interface ----------------
export interface IProductDocument extends IProduct, Document {
  recalcPricing(): Promise<IProductDocument>;
  softDelete(): Promise<IProductDocument>;
}

// ---------------- Model Interface ----------------
export interface IProductModel extends Model<IProductDocument> {
  findOrgProducts(orgId: mongoose.Types.ObjectId): Promise<IProductDocument[]>;
  findByBarcode(orgId: mongoose.Types.ObjectId, barcode: string): Promise<IProductDocument | null>;
}
