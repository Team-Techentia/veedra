// lib/types/organization/organization.types.ts
import mongoose, { Document, Model } from "mongoose";

export type TOrgTaxSystem = "GST" | "VAT" | "NONE";
export type TOrgPlan = "FREE" | "PRO" | "ENTERPRISE";

export interface IOrganizationFeatureFlags {
  enableEcommerce?: boolean;
  enableInfluencer?: boolean;
  enableWallet?: boolean;
  enableInventory?: boolean;
  enableAccounting?: boolean;
  enableGSTExport?: boolean;
  [key: string]: boolean | undefined;
}

// ---------------- Base Interface ----------------
export interface IOrganization {
  orgId: string; // business identifier

  name: string;
  legalName?: string;

  currency: string; // INR, USD etc
  country: string; // IN etc
  timezone: string; // Asia/Kolkata etc
  taxSystem: TOrgTaxSystem;

  plan: TOrgPlan;
  featureFlags: IOrganizationFeatureFlags;

  ownerUserId: mongoose.Types.ObjectId;

  isActive: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

// ---------------- Document Interface ----------------
export interface IOrganizationDocument extends IOrganization, Document {
  activate(): Promise<IOrganizationDocument>;
  deactivate(): Promise<IOrganizationDocument>;
  updatePlan(plan: TOrgPlan): Promise<IOrganizationDocument>;
  statusLabel: string; // virtual
}

// ---------------- Model Interface ----------------
export interface IOrganizationModel extends Model<IOrganizationDocument> {
  findActiveOne(orgId: string): Promise<IOrganizationDocument | null>;
  findActive(): Promise<IOrganizationDocument[]>;
}