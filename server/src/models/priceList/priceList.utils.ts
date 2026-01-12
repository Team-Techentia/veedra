import mongoose from "mongoose";
import { IPriceListDocument, IPriceListModel } from "../../lib/types/priceList/priceList.types.js";

export const priceListModelUtils = {
    // ---------------- Instance Methods ----------------
    methods: {
        async expire(this: IPriceListDocument) {
            this.status = "EXPIRED";
            this.effectiveTo = this.effectiveTo ?? new Date();
            await this.save();
            return this;
        },
    },

    // ---------------- Static Methods ----------------
    statics: {
        async findActiveForProduct(this: IPriceListModel, orgId: mongoose.Types.ObjectId, productId: string) {
            return this.findOne({
                orgId,
                productId,
                status: "ACTIVE",
            }).sort({ version: -1 });
        },

        async findLatestForProduct(this: IPriceListModel, orgId: mongoose.Types.ObjectId, productId: string) {
            return this.findOne({ orgId, productId }).sort({ version: -1, effectiveFrom: -1 });
        },

        async findProductHistory(this: IPriceListModel, orgId: mongoose.Types.ObjectId, productId: string) {
            return this.find({ orgId, productId }).sort({ version: -1, effectiveFrom: -1 });
        },

        async createNewVersion(
            this: IPriceListModel,
            input: {
                orgId: mongoose.Types.ObjectId;
                priceListId: string;
                productId: string;
                basePrice: number;
                mrp: number;
                currency: string;
                createdBy?: mongoose.Types.ObjectId;
                effectiveFrom?: Date;
            }
        ) {
            const { orgId, priceListId, productId, basePrice, mrp, currency, createdBy, effectiveFrom } = input;

            // expire currently active row
            const active = await this.findOne({ orgId, productId, status: "ACTIVE" }).sort({ version: -1 });
            if (active) {
                active.status = "EXPIRED";
                active.effectiveTo = new Date();
                await active.save();
            }

            const last = await this.findOne({ orgId, productId }).sort({ version: -1 });

            const nextVersion = (last?.version || 0) + 1;

            const row = await this.create({
                orgId,
                priceListId,
                productId,
                basePrice,
                mrp,
                currency,

                effectiveFrom: effectiveFrom ?? new Date(),
                effectiveTo: undefined,
                version: nextVersion,
                status: "ACTIVE",

                createdBy,
            });

            return row;
        },
    },

    // ---------------- Virtuals ----------------
    virtuals: {
        statusLabel: function (this: IPriceListDocument) {
            if (this.status === "EXPIRED") return "Expired";
            return "Active";
        },
    },
};