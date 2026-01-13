import { model, Schema } from "mongoose";
import { ICategoryDocument, ICategoryModel, ISubCategoryDocument, ISubCategoryModel } from "../../lib/types/category/category.types.js";
import { categoryModelUtils, subCategoryModelUtils } from "./category.utils.js";

const categorySchema = new Schema<ICategoryDocument, ICategoryModel>(
  {
    orgId: { type: Schema.Types.ObjectId, required: true, index: true },

    categoryId: { type: String, required: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true, index: true },

    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE", index: true },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

// unique per org (category code)
categorySchema.index(
  { orgId: 1, code: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

// optional uniqueness on categoryId too
categorySchema.index(
  { orgId: 1, categoryId: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

categorySchema.methods = categoryModelUtils.methods;
categorySchema.statics = categoryModelUtils.statics;

export const Category: ICategoryModel = model<ICategoryDocument, ICategoryModel>("Category", categorySchema);

// import { model, Schema } from "mongoose";
// import { ISubCategoryDocument, ISubCategoryModel } from "../../lib/types/subcategory/subcategory.types.js";

const subCategorySchema = new Schema<ISubCategoryDocument, ISubCategoryModel>(
  {
    orgId: { type: Schema.Types.ObjectId, required: true, index: true },

    subCategoryId: { type: String, required: true, trim: true, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },

    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true, index: true },

    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE", index: true },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

// unique subcategory code per org
subCategorySchema.index(
  { orgId: 1, code: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

// optional: subcategoryId unique per org
subCategorySchema.index(
  { orgId: 1, subCategoryId: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

subCategorySchema.methods = subCategoryModelUtils.methods;
subCategorySchema.statics = subCategoryModelUtils.statics;

export const SubCategory: ISubCategoryModel = model<ISubCategoryDocument, ISubCategoryModel>("SubCategory", subCategorySchema);
