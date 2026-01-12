import { IProductDocument, IProductModel } from "../../types";

export const productModelUtils = {
  // ---------------- Instance Methods ----------------
  methods: {
    async markInactive(this: IProductDocument) {
      this.isActive = false;
      await this.save();
      return this;
    },

    async softDelete(this: IProductDocument) {
      this.isDeleted = true;
      await this.save();
      return this;
    },

    async updateStock(this: IProductDocument, qty: number) {
      this.stock += qty;
      if (this.stock < 0) this.stock = 0;
      await this.save();
      return this;
    },
  },

  // ---------------- Static Methods ----------------
  statics: {
    async findActiveOne(this: IProductModel, productId: string) {
      return this.findOne({
        productId,
        isDeleted: false,
        isActive: true,
      });
    },

    async findActive(this: IProductModel) {
      return this.find({
        isDeleted: false,
        isActive: true,
      });
    },
  },

  // ---------------- Virtuals ----------------
  virtuals: {
    status: function (this: IProductDocument) {
      if (this.isDeleted) return "Deleted";
      if (!this.isActive) return "Inactive";
      if (this.stock <= 0) return "Out of Stock";
      return "Available";
    },
  },
};
