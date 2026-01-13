import { model, Schema } from "mongoose";
import { IProductDocument, IProductModel } from "../../lib/types/product/product.types.js";
import { productModelUtils } from "./product.utils.js";

const imageSchema = new Schema({ url: { type: String, required: true }, publicId: { type: String } }, { _id: false });

const productSchema = new Schema<IProductDocument, IProductModel>(
  {
    orgId: { type: Schema.Types.ObjectId, required: true, index: true },

    productId: { type: String, required: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },

    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    subCategoryId: { type: Schema.Types.ObjectId, ref: "SubCategory", index: true },

    barcode: { type: String, required: true, trim: true, index: true },
    sku: { type: String, required: true, trim: true, index: true },

    images: { type: [imageSchema], default: [] },

    pricing: {
      factoryPrice: { type: Number, required: true, min: 0 },
      mrp: { type: Number, required: true, min: 0 },
      offerPrice: { type: Number, required: true, min: 0 },
      gstPercent: { type: Number, required: true, min: 0, max: 100, default: 0 },
      allowOverride: { type: Boolean, default: true },
      lastCalculatedAt: { type: Date },
    },

    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE", index: true },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

// Unique barcode per org
productSchema.index(
  { orgId: 1, barcode: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

productSchema.methods = productModelUtils.methods;
productSchema.statics = productModelUtils.statics;

export const Product: IProductModel = model<IProductDocument, IProductModel>("Product", productSchema);
