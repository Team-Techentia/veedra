import mongoose from "mongoose";
import { IProductDocument, IProductModel } from "../../lib/types/product/product.types.js";

const round = (n: number) => Math.round(n);

export const productModelUtils = {
  methods: {
    async recalcPricing(this: IProductDocument) {
      const factory = this.pricing.factoryPrice;

      // RULES (your screenshot)
      const mrp = factory * 2;
      const offer = factory / 0.6;

      this.pricing.mrp = round(mrp);
      this.pricing.offerPrice = round(offer);
      this.pricing.lastCalculatedAt = new Date();

      await this.save();
      return this;
    },

    async softDelete(this: IProductDocument) {
      this.isDeleted = true;
      this.deletedAt = new Date();
      this.status = "INACTIVE";
      await this.save();
      return this;
    },
  },

  statics: {
    async findOrgProducts(this: IProductModel, orgId: mongoose.Types.ObjectId) {
      return this.find({ orgId, isDeleted: false }).sort({ createdAt: -1 });
    },

    async findByBarcode(this: IProductModel, orgId: mongoose.Types.ObjectId, barcode: string) {
      return this.findOne({ orgId, barcode, isDeleted: false });
    },
  },
};
