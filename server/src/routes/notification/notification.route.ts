// @/routes/notification/notification.route.ts
import { Router } from 'express';
import { authenticate } from '../../lib/middlewares';
import { notificationController } from '../../controllers/notification/notification.controller';
import { validate } from 'node-cron';

export const notificationRouter = Router();

// All routes require authentication
notificationRouter.use(authenticate);

// User endpoints
notificationRouter.get(
  '/',
  notificationController.getNotifications
);

notificationRouter.get(
  '/unread-count',
  notificationController.getUnreadCount
);

notificationRouter.patch(
  '/:notificationId/read',
  notificationController.markAsRead
);

notificationRouter.post(
  '/mark-all-read',
  notificationController.markAllAsRead
);

notificationRouter.get(
  '/preferences',
  notificationController.updatePreferences
);

notificationRouter.put(
  '/preferences',
  notificationController.updatePreferences
);

notificationRouter.post(
  '/push-token',
  notificationController.registerPushToken
);

// Admin endpoints
// notificationRouter.post(
//   '/send',
//   authorize('notification:send'),
//   validate({ body: sendNotificationSchema }),
//   notificationController.sendCustom
// );

// notificationRouter.get(
//   '/analytics',
//   authorize('notification:analytics'),
//   notificationController.getAnalytics
// );