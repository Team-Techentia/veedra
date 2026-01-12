// @/lib/utils/server/sendNotification.server.utils.ts (Updated with withdrawal notifications)
import { Notification } from "@/lib/config/db/models";
import { getIO } from "./socket.server.utils";

type NotificationAction =
  | "admin_new_deposit"
  | "user_deposit_approved";

export const sendNotificationServerUtils = {
  async notify(action: NotificationAction, data: any): Promise<void> {
    let notificationData: any = {};

    switch (action) {
      // Deposit notifications
      case "admin_new_deposit":
        notificationData = {
          isForAdmin: true,
          title: "New Deposit Request",
          body: `New deposit request of ${data.amount} ${data.currency} from ${data.user?.firstName} ${data.user?.lastName}`,
          meta: {
            type: "deposit_request",
            depositId: data._id,
            userId: data.user._id,
            amount: data.amount,
            currency: data.currency,
          },
        };
        break;

      case "user_deposit_approved":
        notificationData = {
          user: data.user._id,
          title: "Deposit Approved",
          body: `Your deposit of ${data.amount} ${data.currency} has been approved and added to your balance.`,
          meta: {
            type: "deposit_approved",
            depositId: data._id,
            amount: data.amount,
            currency: data.currency,
          },
        };
        break;

      default:
        throw new Error(`Unknown notification action: ${action}`);
    }

    const saved = await new Notification(notificationData).save();
    console.log(`💾 Notification saved to DB: ${action}`);

    // Emit real-time notification via Socket.IO
    const io = getIO();
    if (io) {
      if (notificationData.isForAdmin) {
        io.to("admins").emit("notification", saved);
        console.log(`📤 Notification sent to admins: ${action}`);
      } else if (notificationData.user) {
        io.to(notificationData.user.toString()).emit("notification", saved);
        console.log(
          `📤 Notification sent to user ${notificationData.user}: ${action}`
        );
      }
    } else {
      console.warn("⚠️ Socket.IO not available, notification not sent via socket");
    }

    console.log(`Notification sent: ${action} for ${notificationData.user || 'admin'}`);
  },
};