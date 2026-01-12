import { model, Schema } from "mongoose";
import { IProductDocument, IProductModel } from "../../lib/types/product/product.types.js";
import { productModelUtils } from "./product.utils.js";
import { AppError } from "../../lib/types/index.js";

const productCategoryRefSchema = new Schema(
  {
    categoryId: { type: String, required: true, trim: true },
    primary: { type: Boolean, default: false },
  },
  { _id: false }
);

const productSchema = new Schema<IProductDocument, IProductModel>(
  {
    orgId: { type: Schema.Types.ObjectId, required: true, index: true },

    productId: { type: String, required: [true, "Product ID is missing"], trim: true, index: true },
    sku: { type: String, required: [true, "SKU is missing"], trim: true, uppercase: true, index: true },

    name: { type: String, required: [true, "Product name is missing"], trim: true },
    description: { type: String, trim: true },
    brand: { type: String, trim: true },

    hsn: { type: String, trim: true },
    defaultGstRate: { type: Number, min: 0, max: 100 },

    categories: { type: [productCategoryRefSchema], default: [] },

    attributes: { type: Schema.Types.Mixed, default: {} },
    tags: { type: [String], default: [] },

    isActive: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },

    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ---------------- Indexes ----------------

// productId unique per org (non-deleted)
productSchema.index(
  { orgId: 1, productId: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

// sku unique per org (non-deleted)
productSchema.index(
  { orgId: 1, sku: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

// filtering & listing
productSchema.index({ orgId: 1, isDeleted: 1, isActive: 1 });
productSchema.index({ orgId: 1, brand: 1, isDeleted: 1 });
productSchema.index({ orgId: 1, "categories.categoryId": 1, isDeleted: 1 });

// ---------------- Hooks (invariants) ----------------
productSchema.pre("validate", function () {
  // normalize sku
  if (this.sku) this.sku = this.sku.toUpperCase().trim();

  // deletion makes inactive
  if (this.isDeleted) {
    this.isActive = false;
    if (!this.deletedAt) this.deletedAt = new Date();
  }

  // categories: at most 1 primary
  const primaryCount = (this.categories || []).filter((c) => c.primary).length;
  if (primaryCount > 1) {
    throw new AppError("Product cannot have more than 1 primary category");
  }

  // if categories exist but none primary -> set first as primary
  if ((this.categories || []).length > 0 && primaryCount === 0) {
    this.categories[0].primary = true;
  }
});

// ---------------- Methods & Statics ----------------
productSchema.methods = productModelUtils.methods;
productSchema.statics = productModelUtils.statics;

// ---------------- Virtuals ----------------
Object.entries(productModelUtils.virtuals).forEach(([name, getter]) => {
  productSchema.virtual(name).get(getter);
});

export const Product: IProductModel = model<IProductDocument, IProductModel>("Product", productSchema);
