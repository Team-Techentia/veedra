// @/models/notificationTemplate.model.ts
import { Schema, model } from 'mongoose';
import { NotificationChannel, NotificationType } from '../../lib/types/index.js';

const NotificationTemplateSchema = new Schema({
    templateId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    type: { type: String, enum: Object.values(NotificationType), required: true },

    // Multi-language support
    translations: {
        type: Map,
        of: {
            subject: String,
            body: String,
            htmlBody: String, // For emails
            pushTitle: String,
            pushBody: String
        }
    },

    defaultLanguage: { type: String, default: 'en' },

    // Channel-specific templates
    channels: {
        [NotificationChannel.EMAIL]: {
            enabled: Boolean,
            subjectTemplate: String,
            bodyTemplate: String,
            htmlTemplate: String
        },
        [NotificationChannel.PUSH]: {
            enabled: Boolean,
            titleTemplate: String,
            bodyTemplate: String
        },
        [NotificationChannel.SMS]: {
            enabled: Boolean,
            bodyTemplate: String
        },
        [NotificationChannel.IN_APP]: {
            enabled: Boolean,
            titleTemplate: String,
            bodyTemplate: String
        }
    },

    // Variables expected in templateData
    variables: [String],

    isActive: { type: Boolean, default: true },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

export const NotificationTemplate = model('NotificationTemplate', NotificationTemplateSchema);