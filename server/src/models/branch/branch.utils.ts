import mongoose from "mongoose";
import { IBranchDocument, IBranchModel } from "../../lib/types/branch/branch.types.js";

export const branchModelUtils = {
  // ---------------- Instance Methods ----------------
  methods: {
    async activate(this: IBranchDocument) {
      if (this.isDeleted) throw new Error("Deleted branch cannot be activated");
      this.isActive = true;
      await this.save();
      return this;
    },

    async deactivate(this: IBranchDocument) {
      this.isActive = false;
      await this.save();
      return this;
    },

    async softDelete(this: IBranchDocument) {
      this.isDeleted = true;
      this.deletedAt = new Date();
      this.isActive = false;
      await this.save();
      return this;
    },
  },

  // ---------------- Static Methods ----------------
  statics: {
    async findActiveOne(this: IBranchModel, orgId: mongoose.Types.ObjectId, branchId: string) {
      return this.findOne({
        orgId,
        branchId,
        isDeleted: false,
        isActive: true,
      });
    },

    async findOrgBranches(this: IBranchModel, orgId: mongoose.Types.ObjectId) {
      return this.find({ orgId, isDeleted: false }).sort({ createdAt: -1 });
    },

    async findActiveOrgBranches(this: IBranchModel, orgId: mongoose.Types.ObjectId) {
      return this.find({ orgId, isDeleted: false, isActive: true }).sort({ createdAt: -1 });
    },
  },

  // ---------------- Virtuals ----------------
  virtuals: {
    statusLabel: function (this: IBranchDocument) {
      if (this.isDeleted) return "Deleted";
      if (!this.isActive) return "Inactive";
      return "Active";
    },
  },
};