import { model, models, Schema } from "mongoose";
import { productModelUtils } from "./product.utils";
import { IProductDocument, IProductModel } from "../../types";

const productSchema = new Schema<IProductDocument, IProductModel>(
  {
    productId: { type: String, required: [true, "Product ID is missing"], index: true, },
    name: { type: String, required: [true, "Product name is missing"], trim: true, },
    description: { type: String, trim: true, },
    price: { type: Number, required: true, min: 0, },
    stock: { type: Number, required: true, min: 0, default: 0, },
    soldCount: { type: Number, default: 0, },
    isActive: { type: Boolean, default: true, },
    isDeleted: { type: Boolean, default: false, },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ---------------- Indexes ----------------
productSchema.index({ productId: 1, isDeleted: 1 }, { unique: true });
productSchema.index({ isDeleted: 1, isActive: 1 });

// ---------------- Methods & Statics ----------------
productSchema.methods = productModelUtils.methods;
productSchema.statics = productModelUtils.statics;

// ---------------- Virtuals ----------------
Object.entries(productModelUtils.virtuals).forEach(([name, getter]) => {
  productSchema.virtual(name).get(getter);
});

const Product: IProductModel = (models?.Product as IProductModel) || model<IProductDocument, IProductModel>("Product", productSchema);

export default Product;