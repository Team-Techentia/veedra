// @/models/notification.model.ts
import { Schema, model } from 'mongoose';
import { NotificationChannel, NotificationPriority, NotificationStatus, NotificationType } from '../../lib/types/index.js';

const NotificationSchema = new Schema({
    notificationId: { type: String, required: true, unique: true, index: true },
    type: { type: String, enum: Object.values(NotificationType), required: true, index: true },
    priority: { type: String, enum: Object.values(NotificationPriority), default: NotificationPriority.MEDIUM, index: true },
    status: { type: String, enum: Object.values(NotificationStatus), default: NotificationStatus.PENDING, index: true },
    // Recipients
    recipientId: { type: String, ref: 'User', index: true },
    recipientEmail: String,
    recipientMobile: String,

    // Content
    subject: String,
    body: String,
    templateId: String,
    templateData: Schema.Types.Mixed,

    // Delivery tracking per channel
    channels: [{
        channel: { type: String, enum: Object.values(NotificationChannel) },
        status: { type: String, enum: Object.values(NotificationStatus) },
        sentAt: Date,
        deliveredAt: Date,
        failedAt: Date,
        errorMessage: String,
        retryCount: { type: Number, default: 0 },
        nextRetryAt: Date,
        externalId: String // provider's message ID
    }],

    // Metadata
    metadata: {
        resourceType: String,
        resourceId: String,
        branchId: { type: String, ref: 'Branch' },
        triggeredBy: { type: String, ref: 'User' },
        triggeredByAction: String
    },

    // Scheduling
    scheduledFor: { type: Date, index: true },
    processedAt: Date,

    // Analytics
    readAt: Date,
    clickedAt: Date,

    // Expiry
    expiresAt: { type: Date, index: true },

    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now }
});

// Compound indexes for common queries
NotificationSchema.index({ recipientId: 1, status: 1, createdAt: -1 });
NotificationSchema.index({ type: 1, status: 1, scheduledFor: 1 });
NotificationSchema.index({ status: 1, priority: 1, scheduledFor: 1 });

export const Notification = model('Notification', NotificationSchema);