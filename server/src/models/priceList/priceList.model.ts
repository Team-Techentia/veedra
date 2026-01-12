import { model, Schema } from "mongoose";
import { IPriceListDocument, IPriceListModel } from "../../lib/types/priceList/priceList.types.js";
import { priceListModelUtils } from "./priceList.utils.js";
import { AppError } from "../../lib/types/index.js";

const priceListSchema = new Schema<IPriceListDocument, IPriceListModel>(
  {
    orgId: { type: Schema.Types.ObjectId, required: true, index: true },

    priceListId: { type: String, required: [true, "PriceList ID is missing"], trim: true, index: true },
    productId: { type: String, required: [true, "Product ID is missing"], trim: true, index: true },

    basePrice: { type: Number, required: true, min: 0 },
    mrp: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: "INR", uppercase: true, trim: true },

    effectiveFrom: { type: Date, required: true, default: () => new Date(), index: true },
    effectiveTo: { type: Date, index: true },

    version: { type: Number, required: true, min: 1, default: 1, index: true },
    status: { type: String, required: true, enum: ["ACTIVE", "EXPIRED"], default: "ACTIVE", index: true },

    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ---------------- Indexes ----------------

// business identifier unique per org
priceListSchema.index({ orgId: 1, priceListId: 1 }, { unique: true });

// price history lookups
priceListSchema.index({ orgId: 1, productId: 1, version: -1 });
priceListSchema.index({ orgId: 1, productId: 1, status: 1, effectiveFrom: -1 });

// ---------------- Hooks (invariants) ----------------
priceListSchema.pre("validate", function (next) {
  // normalize currency
  if (this.currency) this.currency = this.currency.toUpperCase().trim();

  // effectiveTo cannot be earlier than effectiveFrom
  if (this.effectiveTo && this.effectiveTo.getTime() < this.effectiveFrom.getTime()) {
    throw new AppError("effectiveTo cannot be earlier than effectiveFrom");
  }

  // derived status protection
  if (this.effectiveTo && this.status !== "EXPIRED") {
    this.status = "EXPIRED";
  }
});

// ---------------- Methods & Statics ----------------
priceListSchema.methods = priceListModelUtils.methods;
priceListSchema.statics = priceListModelUtils.statics;

// ---------------- Virtuals ----------------
Object.entries(priceListModelUtils.virtuals).forEach(([name, getter]) => {
  priceListSchema.virtual(name).get(getter);
});

export const PriceList: IPriceListModel = model<IPriceListDocument, IPriceListModel>(
  "PriceList",
  priceListSchema
);