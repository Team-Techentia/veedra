import { Document, Model } from "mongoose";

export interface IProduct {
  productId: string;        // business ID / SKU
  name: string;
  description?: string;
  price: number;
  stock: number;
  isActive: boolean;
  isDeleted: boolean;
  soldCount: number;
}

// ---------------- Document Interface ----------------
export interface IProductDocument extends IProduct, Document {
  markInactive(): Promise<IProductDocument>;
  softDelete(): Promise<IProductDocument>;
  updateStock(qty: number): Promise<IProductDocument>;
  status: string; // virtual
}

// ---------------- Model Interface ----------------
export interface IProductModel extends Model<IProductDocument> {
  findActiveOne(productId: string): Promise<IProductDocument | null>;
  findActive(): Promise<IProductDocument[]>;
}