import { model, Schema } from "mongoose";
import { IBranchDocument, IBranchModel } from "../../lib/types/branch/branch.types.js";
import { branchModelUtils } from "./branch.utils.js";

const branchSchema = new Schema<IBranchDocument, IBranchModel>(
  {
    orgId: { type: Schema.Types.ObjectId, required: true, index: true },

    branchId: { type: String, required: [true, "Branch ID is missing"], trim: true, index: true },
    name: { type: String, required: [true, "Branch name is missing"], trim: true },

    address: { type: String, trim: true },
    gstNo: { type: String, trim: true, uppercase: true },
    phone: { type: String, trim: true },

    billingSeriesPrefix: { type: String, trim: true, uppercase: true },

    type: { type: String, required: true, enum: ["STORE", "WAREHOUSE"], default: "STORE", index: true },

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

// Branch ID unique per org (non-deleted)
branchSchema.index(
  { orgId: 1, branchId: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

// common listing filters
branchSchema.index({ orgId: 1, isDeleted: 1, isActive: 1 });
branchSchema.index({ orgId: 1, type: 1, isActive: 1 });

// ---------------- Hooks (invariants) ----------------
branchSchema.pre("validate", function () {
  // if deleted => inactive
  if (this.isDeleted) {
    this.isActive = false;
    if (!this.deletedAt) this.deletedAt = new Date();
  }
});

// ---------------- Methods & Statics ----------------
branchSchema.methods = branchModelUtils.methods;
branchSchema.statics = branchModelUtils.statics;

// ---------------- Virtuals ----------------
Object.entries(branchModelUtils.virtuals).forEach(([name, getter]) => {
  branchSchema.virtual(name).get(getter);
});

export const Branch: IBranchModel = model<IBranchDocument, IBranchModel>("Branch", branchSchema);