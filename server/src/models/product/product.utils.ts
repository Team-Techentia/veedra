import mongoose from "mongoose";
import { IProductDocument, IProductModel } from "../../lib/types/product/product.types.js";

export const productModelUtils = {
  // ---------------- Instance Methods ----------------
  methods: {
    async markInactive(this: IProductDocument) {
      this.isActive = false;
      await this.save();
      return this;
    },

    async markActive(this: IProductDocument) {
      if (this.isDeleted) throw new Error("Deleted product cannot be activated");
      this.isActive = true;
      await this.save();
      return this;
    },

    async softDelete(this: IProductDocument) {
      this.isDeleted = true;
      this.deletedAt = new Date();
      this.isActive = false;
      await this.save();
      return this;
    },

    async setPrimaryCategory(this: IProductDocument, categoryId: string) {
      const cats = this.categories || [];
      if (cats.length === 0) throw new Error("Product has no categories to set primary");

      let found = false;
      for (const c of cats) {
        if (c.categoryId === categoryId) {
          c.primary = true;
          found = true;
        } else {
          c.primary = false;
        }
      }
      if (!found) throw new Error("Category not attached to product");

      this.categories = cats;
      await this.save();
      return this;
    },
  },

  // ---------------- Static Methods ----------------
  statics: {
    async findActiveOne(this: IProductModel, orgId: mongoose.Types.ObjectId, productId: string) {
      return this.findOne({
        orgId,
        productId,
        isDeleted: false,
        isActive: true,
      });
    },

    async findBySku(this: IProductModel, orgId: mongoose.Types.ObjectId, sku: string) {
      return this.findOne({
        orgId,
        sku: sku.toUpperCase().trim(),
        isDeleted: false,
      });
    },

    async findOrgProducts(this: IProductModel, orgId: mongoose.Types.ObjectId) {
      return this.find({ orgId, isDeleted: false }).sort({ createdAt: -1 });
    },

    async findActiveOrgProducts(this: IProductModel, orgId: mongoose.Types.ObjectId) {
      return this.find({ orgId, isDeleted: false, isActive: true }).sort({ createdAt: -1 });
    },
  },

  // ---------------- Virtuals ----------------
  virtuals: {
    statusLabel: function (this: IProductDocument) {
      if (this.isDeleted) return "Deleted";
      if (!this.isActive) return "Inactive";
      return "Active";
    },
  },
};
