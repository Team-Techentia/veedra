// lib/types/branch/branch.types.ts
import mongoose, { Document, Model } from "mongoose";

export type TBranchType = "STORE" | "WAREHOUSE";

// ---------------- Base Interface ----------------
export interface IBranch {
  orgId: mongoose.Types.ObjectId;

  branchId: string; // business identifier (unique per org)
  name: string;

  address?: string;
  gstNo?: string;
  phone?: string;

  billingSeriesPrefix?: string; // ex: "DL01" or "KNP"
  type: TBranchType;

  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

// ---------------- Document Interface ----------------
export interface IBranchDocument extends IBranch, Document {
  activate(): Promise<IBranchDocument>;
  deactivate(): Promise<IBranchDocument>;
  softDelete(): Promise<IBranchDocument>;

  statusLabel: string; // virtual
}

// ---------------- Model Interface ----------------
export interface IBranchModel extends Model<IBranchDocument> {
  findActiveOne(orgId: mongoose.Types.ObjectId, branchId: string): Promise<IBranchDocument | null>;
  findOrgBranches(orgId: mongoose.Types.ObjectId): Promise<IBranchDocument[]>;
  findActiveOrgBranches(orgId: mongoose.Types.ObjectId): Promise<IBranchDocument[]>;
}