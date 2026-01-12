// lib/types/priceList/priceList.types.ts
import mongoose, { Document, Model } from "mongoose";

export type TPriceListStatus = "ACTIVE" | "EXPIRED";

// ---------------- Base Interface ----------------
export interface IPriceList {
  orgId: mongoose.Types.ObjectId;

  priceListId: string; // business identifier (unique per org)
  productId: string; // business productId (not ObjectId)

  basePrice: number; // offer/selling base (pre tax, depending on your system)
  mrp: number;
  currency: string;

  effectiveFrom: Date;
  effectiveTo?: Date;
  version: number;

  status: TPriceListStatus;

  createdBy?: mongoose.Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}

// ---------------- Document Interface ----------------
export interface IPriceListDocument extends IPriceList, Document {
  expire(): Promise<IPriceListDocument>;
  statusLabel: string; // virtual
}

// ---------------- Model Interface ----------------
export interface IPriceListModel extends Model<IPriceListDocument> {
  findActiveForProduct(orgId: mongoose.Types.ObjectId, productId: string): Promise<IPriceListDocument | null>;
  findLatestForProduct(orgId: mongoose.Types.ObjectId, productId: string): Promise<IPriceListDocument | null>;
  findProductHistory(orgId: mongoose.Types.ObjectId, productId: string): Promise<IPriceListDocument[]>;
  createNewVersion(input: {
    orgId: mongoose.Types.ObjectId;
    priceListId: string;
    productId: string;
    basePrice: number;
    mrp: number;
    currency: string;
    createdBy?: mongoose.Types.ObjectId;
    effectiveFrom?: Date;
  }): Promise<IPriceListDocument>;
}