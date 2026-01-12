// @/models/notificationPreference.model.ts
import { Schema, model } from 'mongoose';
import { NotificationChannel, } from '../../lib/types/index.js';

const NotificationPreferenceSchema = new Schema({
    userId: { type: String, required: true, unique: true, ref: 'User' },

    channels: {
        [NotificationChannel.EMAIL]: { type: Boolean, default: true },
        [NotificationChannel.PUSH]: { type: Boolean, default: true },
        [NotificationChannel.SMS]: { type: Boolean, default: false },
        [NotificationChannel.IN_APP]: { type: Boolean, default: true }
    },

    typePreferences: {
        type: Map,
        of: {
            enabled: { type: Boolean, default: true },
            channels: [{
                type: String,
                enum: Object.values(NotificationChannel)
            }]
        }
    },

    quietHours: {
        enabled: { type: Boolean, default: false },
        start: { type: String, default: "22:00" },
        end: { type: String, default: "08:00" },
        timezone: { type: String, default: "Asia/Kolkata" }
    },

    // Device tokens for push notifications
    pushTokens: [{
        token: String,
        platform: { type: String, enum: ['ios', 'android', 'web'] },
        deviceId: String,
        addedAt: { type: Date, default: Date.now },
        lastUsed: Date
    }],

    updatedAt: { type: Date, default: Date.now }
});

export const NotificationPreference = model('NotificationPreference', NotificationPreferenceSchema);
