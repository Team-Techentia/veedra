// @/jobs/notification.jobs.ts
import cron from 'node-cron';
import { Notification } from '../../../models/index.js';
import { NotificationChannel, NotificationPriority, NotificationStatus, NotificationType } from '../../types/index.js';
import { notificationService } from '../../services/index.js';
import { notificationTrigger } from '../../middlewares/index.js';

export class NotificationJobs {
  /**
   * Process scheduled notifications (runs every minute)
   */
//   static processScheduled() {
//     cron.schedule('* * * * *', async () => {
//       const now = new Date();
      
//       const scheduled = await Notification.find({
//         status: NotificationStatus.PENDING,
//         scheduledFor: { $lte: now }
//       }).limit(100);
      
//       for (const notification of scheduled) {
        // await notificationService.queueNotification(notification, {});
//       }
//     });
//   }
  
  /**
   * Send daily reports (runs at 9 AM)
   */
  static dailyReports() {
    cron.schedule('0 9 * * *', async () => {
      await notificationTrigger.dailySalesReport();
    });
  }
  
  /**
   * Wallet expiry reminders (runs daily at 10 AM)
   */
//   static walletExpiryReminders() {
//     cron.schedule('0 10 * * *', async () => {
//       const sevenDaysFromNow = new Date();
//       sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      
//       // Find wallets expiring in 7 days
//       const expiringWallets = await WalletLedger.find({
//         expiresAt: {
//           $gte: new Date(),
//           $lte: sevenDaysFromNow
//         },
//         status: 'ACTIVE'
//       }).populate('customerId');
      
//       for (const wallet of expiringWallets) {
//         await notificationService.send({
//           type: NotificationType.WALLET_EXPIRING,
//           channels: [NotificationChannel.EMAIL, NotificationChannel.PUSH],
//           priority: NotificationPriority.MEDIUM,
//           recipients: {
//             email: wallet.customerId.email,
//             mobile: wallet.customerId.mobile
//           },
//           templateId: 'wallet-expiring',
//           templateData: {
//             customerName: wallet.customerId.name,
//             amount: wallet.balance,
//             expiryDate: wallet.expiresAt.toLocaleDateString()
//           }
//         });
//       }
//     });
//   }
  
  /**
   * Clean old notifications (runs weekly)
   */
  static cleanup() {
    cron.schedule('0 2 * * 0', async () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      await Notification.deleteMany({
        createdAt: { $lt: sixMonthsAgo },
        status: { $in: [NotificationStatus.SENT, NotificationStatus.FAILED] }
      });
    });
  }
  
  /**
   * Start all jobs
   */
  static startAll() {
    // this.processScheduled();
    this.dailyReports();
    // this.walletExpiryReminders();
    this.cleanup();
    console.log('✅ Notification jobs started');
  }
}

// ============================================================================
// 9. USAGE EXAMPLES
// ============================================================================

/*
// In your billing controller:
import { notificationTrigger } from '../lib/middlewares/notification.middleware';

async createBill(req, res) {
  // ... create bill logic
  
  // Trigger notification
  await notificationTrigger.afterBillCreated(bill, customer);
  
  res.json({ success: true, data: { bill } });
}

// Send to specific user:
await notificationService.send({
  type: NotificationType.INCENTIVE_EARNED,
  channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
  priority: NotificationPriority.MEDIUM,
  recipients: { userId: 'staff_123' },
  templateId: 'incentive-earned',
  templateData: {
    staffName: 'John',
    points: 50,
    totalPoints: 500
  }
});

// Send to all managers:
await notificationService.sendToRole(
  UserRole.BRANCH_MANAGER,
  {
    type: NotificationType.SYSTEM_ALERT,
    channels: [NotificationChannel.EMAIL],
    priority: NotificationPriority.HIGH,
    templateId: 'system-alert',
    templateData: {
      message: 'System maintenance scheduled'
    }
  }
);

// Batch send:
await notificationService.sendBatch([
  { type: NotificationType.WALLET_CREDITED, ... },
  { type: NotificationType.BILL_CREATED, ... }
]);
*/