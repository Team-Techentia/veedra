import { model, Schema } from "mongoose";
import { ICategoryDocument, ICategoryModel } from "../../lib/types/category/category.types.js";
import { categoryModelUtils } from "./category.utils.js";
import { AppError } from "../../lib/types/index.js";

const categorySchema = new Schema<ICategoryDocument, ICategoryModel>(
  {
    orgId: { type: Schema.Types.ObjectId, required: true, index: true },

    categoryId: { type: String, required: [true, "Category ID is missing"], trim: true, index: true },

    name: { type: String, required: [true, "Category name is missing"], trim: true },
    slug: { type: String, required: [true, "Category slug is missing"], trim: true, lowercase: true, index: true },
    fullSlug: { type: String, required: true, trim: true, lowercase: true, index: true },

    parent: { type: String, trim: true, index: true },

    ancestors: { type: [String], default: [], index: true },
    path: { type: [String], default: [] },
    level: { type: Number, required: true, min: 0, default: 0, index: true },
    order: { type: Number, default: 0 },

    type: { type: String, required: true, enum: ["CATEGORY", "BRAND", "COLLECTION", "ATTRIBUTE"], default: "CATEGORY", index: true },

    isLeaf: { type: Boolean, default: true, index: true },
    productCount: { type: Number, default: 0, min: 0 },

    // Versioning
    version: { type: Number, required: true, min: 1, default: 1, index: true },
    effectiveFrom: { type: Date, required: true, default: () => new Date(), index: true },
    effectiveTo: { type: Date, index: true },

    isActive: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ---------------- Indexes ----------------

// categoryId unique per org (non-deleted)
categorySchema.index(
  { orgId: 1, categoryId: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

// slug unique per org (non-deleted)
categorySchema.index(
  { orgId: 1, slug: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

// fullSlug unique per org (non-deleted)
categorySchema.index(
  { orgId: 1, fullSlug: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

// listing + tree query
categorySchema.index({ orgId: 1, parent: 1, isDeleted: 1, isActive: 1 });
categorySchema.index({ orgId: 1, ancestors: 1, isDeleted: 1 });

// ---------------- Hooks (invariants) ----------------
categorySchema.pre("validate", function () {
  // deletion makes inactive
  if (this.isDeleted) {
    this.isActive = false;
    if (!this.deletedAt) this.deletedAt = new Date();
  }

  // effectiveTo cannot be less than effectiveFrom
  if (this.effectiveTo && this.effectiveTo.getTime() < this.effectiveFrom.getTime()) {
    throw new AppError("effectiveTo cannot be earlier than effectiveFrom");
  }

  // level must match ancestors length
  const expectedLevel = this.ancestors?.length || 0;
  if (this.level !== expectedLevel) this.level = expectedLevel;

  // normalize slug
  if (this.slug) this.slug = this.slug.toLowerCase().trim();
  if (this.fullSlug) this.fullSlug = this.fullSlug.toLowerCase().trim();
});

// ---------------- Methods & Statics ----------------
categorySchema.methods = categoryModelUtils.methods;
categorySchema.statics = categoryModelUtils.statics;

// ---------------- Virtuals ----------------
Object.entries(categoryModelUtils.virtuals).forEach(([name, getter]) => {
  categorySchema.virtual(name).get(getter);
});

export const Category: ICategoryModel = model<ICategoryDocument, ICategoryModel>("Category", categorySchema);
