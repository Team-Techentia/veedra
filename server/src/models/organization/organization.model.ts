import { model, Schema } from "mongoose";
import { organizationModelUtils } from "./organization.utils.js";
import { IOrganizationDocument, IOrganizationModel } from "../../lib/types/organization/organization.types.js";

const organizationSchema = new Schema<IOrganizationDocument, IOrganizationModel>(
    {
        orgId: { type: String, required: [true, "Org ID is missing"], index: true },

        name: { type: String, required: [true, "Org name is missing"], trim: true },
        legalName: { type: String, trim: true },

        currency: { type: String, required: true, default: "INR", uppercase: true, trim: true },
        country: { type: String, required: true, default: "IN", uppercase: true, trim: true },
        timezone: { type: String, required: true, default: "Asia/Kolkata", trim: true },
        taxSystem: { type: String, required: true, enum: ["GST", "VAT", "NONE"], default: "GST" },

        plan: { type: String, required: true, enum: ["FREE", "PRO", "ENTERPRISE", "PLATFORM"], default: "FREE" },
        featureFlags: { type: Schema.Types.Mixed, default: {} },

        ownerUserId: { type: Schema.Types.ObjectId, ref: "User", required: function (this: any) { return this.plan !== "PLATFORM" }, index: true },

        isActive: { type: Boolean, default: true, index: true },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// ---------------- Indexes ----------------
organizationSchema.index({ orgId: 1 }, { unique: true });
organizationSchema.index({ isActive: 1, plan: 1 });

// ---------------- Methods & Statics ----------------
organizationSchema.methods = organizationModelUtils.methods;
organizationSchema.statics = organizationModelUtils.statics;

// ---------------- Virtuals ----------------
Object.entries(organizationModelUtils.virtuals).forEach(([name, getter]) => {
    organizationSchema.virtual(name).get(getter);
});

export const Organization: IOrganizationModel = model<IOrganizationDocument, IOrganizationModel>("Organization", organizationSchema);