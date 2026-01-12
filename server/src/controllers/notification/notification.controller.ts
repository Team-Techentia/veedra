// @/controllers/notification.controller.ts
import { Response } from 'express';
import { AppError, AuthRequest, NotificationChannel, NotificationPayload } from '../../lib/types/index.js';
import { Notification, NotificationPreference } from '../../models/index.js';
import { notificationService } from '../../lib/services/index.js';

export const notificationController = {
    /**
     * Get user's notifications (paginated)
     */
    async getNotifications(req: AuthRequest, res: Response) {
        const { page = 1, limit = 20, status, type } = req.query;

        const query: any = {
            recipientId: req.user!.userId,
            'channels.channel': NotificationChannel.IN_APP
        };

        if (status) query.status = status;
        if (type) query.type = type;

        const [notifications, total] = await Promise.all([
            Notification.find(query)
                .sort({ createdAt: -1 })
                .skip((+page - 1) * +limit)
                .limit(+limit)
                .select('-templateData -channels'),

            Notification.countDocuments(query)
        ]);

        return res.json({
            success: true,
            data: {
                notifications,
                pagination: {
                    page: +page,
                    limit: +limit,
                    total,
                    totalPages: Math.ceil(total / +limit)
                }
            }
        });
    },

    /**
     * Mark notification as read
     */
    async markAsRead(req: AuthRequest, res: Response) {
        const { notificationId } = req.params;

        const notification = await Notification.findOneAndUpdate(
            {
                notificationId,
                recipientId: req.user!.userId,
                readAt: null
            },
            {
                readAt: new Date()
            },
            { new: true }
        );

        if (!notification) {
            throw new AppError('Notification not found', 404);
        }

        return res.json({
            success: true,
            data: { notification }
        });
    },

    /**
     * Mark all as read
     */
    async markAllAsRead(req: AuthRequest, res: Response) {
        await Notification.updateMany(
            {
                recipientId: req.user!.userId,
                readAt: null
            },
            {
                readAt: new Date()
            }
        );

        return res.json({
            success: true,
            message: 'All notifications marked as read'
        });
    },

    /**
     * Get unread count
     */
    async getUnreadCount(req: AuthRequest, res: Response) {
        const count = await Notification.countDocuments({
            recipientId: req.user!.userId,
            'channels.channel': NotificationChannel.IN_APP,
            readAt: null
        });

        return res.json({
            success: true,
            data: { count }
        });
    },

    /**
     * Update user preferences
     */
    async updatePreferences(req: AuthRequest, res: Response) {
        const updates = req.body;

        const preferences = await NotificationPreference.findOneAndUpdate(
            { userId: req.user!.userId },
            {
                ...updates,
                updatedAt: new Date()
            },
            {
                new: true,
                upsert: true
            }
        );

        return res.json({
            success: true,
            data: { preferences }
        });
    },

    /**
     * Register push token
     */
    async registerPushToken(req: AuthRequest, res: Response) {
        const { token, platform, deviceId } = req.body;

        await NotificationPreference.findOneAndUpdate(
            { userId: req.user!.userId },
            {
                $addToSet: {
                    pushTokens: {
                        token,
                        platform,
                        deviceId,
                        addedAt: new Date(),
                        lastUsed: new Date()
                    }
                }
            },
            { upsert: true }
        );

        return res.json({
            success: true,
            message: 'Push token registered'
        });
    },

    /**
     * Admin: Send custom notification
     */
    async sendCustom(req: AuthRequest, res: Response) {
        const payload: NotificationPayload = req.body;

        const notificationIds = await notificationService.send(payload);

        return res.json({
            success: true,
            message: 'Notification sent',
            data: { notificationIds }
        });
    },

    /**
     * Admin: Get notification analytics
     */
    async getAnalytics(req: AuthRequest, res: Response) {
        const { startDate, endDate, type, branch } = req.query;

        const match: any = {
            createdAt: {
                $gte: new Date(startDate as string),
                $lte: new Date(endDate as string)
            }
        };

        if (type) match.type = type;
        if (branch) match['metadata.branchId'] = branch;

        const stats = await Notification.aggregate([
            { $match: match },
            {
                $group: {
                    _id: '$type',
                    total: { $sum: 1 },
                    sent: {
                        $sum: { $cond: [{ $eq: ['$status', 'SENT'] }, 1, 0] }
                    },
                    failed: {
                        $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] }
                    },
                    read: {
                        $sum: { $cond: [{ $ne: ['$readAt', null] }, 1, 0] }
                    }
                }
            }
        ]);

        return res.json({
            success: true,
            data: { stats }
        });
    }
};