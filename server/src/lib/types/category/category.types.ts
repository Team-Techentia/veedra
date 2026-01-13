import mongoose, { Document, Model } from "mongoose";

export type TCategoryStatus = "ACTIVE" | "INACTIVE";

export interface ICategory {
  orgId: mongoose.Types.ObjectId;

  categoryId: string; // business id
  name: string;
  code: string;

  status: TCategoryStatus;

  createdBy: mongoose.Types.ObjectId;

  isDeleted: boolean;
  deletedAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICategoryDocument extends ICategory, Document {
  softDelete(): Promise<ICategoryDocument>;
}

export interface ICategoryModel extends Model<ICategoryDocument> {
  findOrgCategories(orgId: mongoose.Types.ObjectId): Promise<ICategoryDocument[]>;
  findByCode(orgId: mongoose.Types.ObjectId, code: string): Promise<ICategoryDocument | null>;
}
// import mongoose, { Document, Model } from "mongoose";

export type TSubCategoryStatus = "ACTIVE" | "INACTIVE";

export interface ISubCategory {
  orgId: mongoose.Types.ObjectId;

  subCategoryId: string; // business id
  categoryId: mongoose.Types.ObjectId;

  name: string;
  code: string;

  status: TSubCategoryStatus;

  createdBy: mongoose.Types.ObjectId;

  isDeleted: boolean;
  deletedAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISubCategoryDocument extends ISubCategory, Document {
  softDelete(): Promise<ISubCategoryDocument>;
}

export interface ISubCategoryModel extends Model<ISubCategoryDocument> {
  findOrgSubCategories(orgId: mongoose.Types.ObjectId): Promise<ISubCategoryDocument[]>;
  findCategorySubCategories(orgId: mongoose.Types.ObjectId, categoryId: mongoose.Types.ObjectId): Promise<ISubCategoryDocument[]>;
  findByCode(orgId: mongoose.Types.ObjectId, code: string): Promise<ISubCategoryDocument | null>;
}
