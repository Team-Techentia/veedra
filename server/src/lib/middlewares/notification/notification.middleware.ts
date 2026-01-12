// @/lib/middlewares/notification.middleware.ts

import { Role } from "../../consts/roles/roles.consts.js";
import { notificationService } from "../../services/index.js";
import { NotificationChannel, NotificationPriority, NotificationType } from "../../types/index.js";

export const notificationTrigger = {
  /**
   * After bill creation
   */
  afterBillCreated: async (bill: any, customer: any) => {
    // Customer notification
    await notificationService.send({
      type: NotificationType.BILL_CREATED,
      channels: [NotificationChannel.EMAIL, NotificationChannel.SMS],
      priority: NotificationPriority.HIGH,
      recipients: {
        email: customer.email,
        mobile: customer.mobile
      },
      templateId: 'bill-created',
      templateData: {
        customerName: customer.name,
        billNumber: bill.billNumber,
        amount: bill.totalAmount,
        storeName: bill.branchName,
        billDate: bill.createdAt
      }
    });

    // Manager notification (if high value)
    if (bill.totalAmount > 10000) {
      await notificationService.send({
        type: NotificationType.BILL_CREATED,
        channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
        priority: NotificationPriority.MEDIUM,
        recipients: {
          branchId: bill.branchId,
          roles: [Role.BRANCH_MANAGER, Role.TENANT_SUPER_ADMIN]
        },
        templateId: 'high-value-sale',
        templateData: {
          billNumber: bill.billNumber,
          amount: bill.totalAmount,
          salesPerson: bill.salesPersonName
        }
      });
    }
  },

  /**
   * After wallet credit
   */
  afterWalletCredit: async (customer: any, amount: number, billRef: string) => {
    await notificationService.send({
      type: NotificationType.WALLET_CREDITED,
      channels: [NotificationChannel.EMAIL, NotificationChannel.PUSH],
      priority: NotificationPriority.MEDIUM,
      recipients: {
        email: customer.email,
        mobile: customer.mobile
      },
      templateId: 'wallet-credited',
      templateData: {
        customerName: customer.name,
        amount,
        newBalance: customer.walletBalance,
        billRef
      }
    });
  },

  /**
   * Low stock alert
   */
  lowStockAlert: async (product: any, branch: any) => {
    await notificationService.send({
      type: NotificationType.LOW_STOCK_ALERT,
      channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
      priority: NotificationPriority.HIGH,
      recipients: {
        branchId: branch.branchId,
        roles: [Role.BRANCH_MANAGER, Role.TENANT_SUPER_ADMIN]
      },
      templateId: 'low-stock-alert',
      templateData: {
        productName: product.name,
        currentStock: product.stock,
        branchName: branch.name
      }
    });
  },

  /**
   * Daily sales report
   */
  dailySalesReport: async () => {
    // Get all branches
    // const branches = await Branch.find({ isActive: true });

    // for (const branch of branches) {
    //   // Calculate daily stats
    //   const startOfDay = new Date();
    //   startOfDay.setHours(0, 0, 0, 0);

    //   const stats = await Bill.aggregate([
    //     {
    //       $match: {
    //         branchId: branch.branchId,
    //         createdAt: { $gte: startOfDay },
    //         status: 'COMPLETED'
    //       }
    //     },
    //     {
    //       $group: {
    //         _id: null,
    //         totalSales: { $sum: '$totalAmount' },
    //         totalBills: { $sum: 1 }
    //       }
    //     }
    //   ]);

    //   // Send to branch manager
    //   await notificationService.send({
    //     type: NotificationType.DAILY_REPORT,
    //     channels: [NotificationChannel.EMAIL],
    //     priority: NotificationPriority.LOW,
    //     recipients: {
    //       branchId: branch.branchId,
    //       role: UserRole.BRANCH_MANAGER
    //     },
    //     templateId: 'daily-sales-report',
    //     templateData: {
    //       branchName: branch.name,
    //       date: new Date().toLocaleDateString(),
    //       totalSales: stats[0]?.totalSales || 0,
    //       totalBills: stats[0]?.totalBills || 0
    //     }
    //   });
    // }
  }
};