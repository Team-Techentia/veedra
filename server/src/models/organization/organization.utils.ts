import { IOrganizationDocument, IOrganizationModel, TOrgPlan } from "../../lib/types/organization/organization.types.js";

export const organizationModelUtils = {
    // ---------------- Instance Methods ----------------
    methods: {
        async activate(this: IOrganizationDocument) {
            this.isActive = true;
            await this.save();
            return this;
        },

        async deactivate(this: IOrganizationDocument) {
            this.isActive = false;
            await this.save();
            return this;
        },

        async updatePlan(this: IOrganizationDocument, plan: TOrgPlan) {
            this.plan = plan;
            await this.save();
            return this;
        },
    },

    // ---------------- Static Methods ----------------
    statics: {
        async findActiveOne(this: IOrganizationModel, orgId: string) {
            return this.findOne({ orgId, isActive: true });
        },

        async findActive(this: IOrganizationModel) {
            return this.find({ isActive: true }).sort({ createdAt: -1 });
        },
    },

    // ---------------- Virtuals ----------------
    virtuals: {
        statusLabel: function (this: IOrganizationDocument) {
            return this.isActive ? "Active" : "Inactive";
        },
    },
};