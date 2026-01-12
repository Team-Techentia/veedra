import { model, Schema } from "mongoose";

// Audit Log
const AuditLogSchema = new Schema({
    userId: String,
    action: String, // 'bill:cancel', 'product:price:override', etc.
    resource: String, // 'Bill', 'Product', etc.
    resourceId: String,
    changes: Schema.Types.Mixed,
    metadata: {
        ip: String,
        userAgent: String,
        branchId: String
    },
    timestamp: { type: Date, default: Date.now }
});

export const Audit = model("Audit", AuditLogSchema)