// lib/types/category/category.types.ts
import mongoose, { Document, Model } from "mongoose";

export type TCategoryType = "CATEGORY" | "BRAND" | "COLLECTION" | "ATTRIBUTE";

// ---------------- Base Interface ----------------
export interface ICategory {
  orgId: mongoose.Types.ObjectId;

  categoryId: string; // business identifier (unique per org, non-deleted)

  name: string;
  slug: string; // unique per org (non-deleted)
  fullSlug: string; // parent chain: men/shirts/formal

  parent?: string; // categoryId of parent (not ObjectId, stable business ref)

  ancestors: string[]; // list of categoryIds (root -> parent)
  path: string[]; // same but may contain names/slugs (you decide); keep stable
  level: number;
  order: number;

  type: TCategoryType;

  isLeaf: boolean;
  productCount: number;

  // versioning
  version: number;
  effectiveFrom: Date;
  effectiveTo?: Date;

  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

// ---------------- Document Interface ----------------
export interface ICategoryDocument extends ICategory, Document {
  activate(): Promise<ICategoryDocument>;
  deactivate(): Promise<ICategoryDocument>;
  softDelete(): Promise<ICategoryDocument>;

  // versioning: create new version instead of mutating meaning
  createNewVersion(input: Partial<Pick<ICategory, "name" | "slug" | "fullSlug" | "path" | "order" | "isLeaf">>): Promise<ICategoryDocument>;

  statusLabel: string; // virtual
}

// ---------------- Model Interface ----------------
export interface ICategoryModel extends Model<ICategoryDocument> {
  findActiveOne(orgId: mongoose.Types.ObjectId, categoryId: string): Promise<ICategoryDocument | null>;
  findBySlug(orgId: mongoose.Types.ObjectId, slug: string): Promise<ICategoryDocument | null>;
  findOrgCategories(orgId: mongoose.Types.ObjectId): Promise<ICategoryDocument[]>;
  findActiveOrgCategories(orgId: mongoose.Types.ObjectId): Promise<ICategoryDocument[]>;
  findChildren(orgId: mongoose.Types.ObjectId, parentCategoryId: string): Promise<ICategoryDocument[]>;
}