import { Document, Model, Schema, Types } from "mongoose";

export interface INotification {
  user?: Types.ObjectId;
  isForAdmin: boolean;
  title: string;
  body: string;
  read: boolean;
  meta?: {
    type: string;
    depositId?: Schema.Types.ObjectId;
    userId?: Schema.Types.ObjectId;
    packageId?: Schema.Types.ObjectId;
    investmentId?: Schema.Types.ObjectId;
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface INotificationDocument extends INotification, Document {
  markAsRead(): Promise<INotificationDocument>;
  markAsUnread(): Promise<INotificationDocument>;
  // Virtuals
  isUnread: boolean;
  age: number;
  isRecent: boolean;
}

export interface INotificationModel extends Model<INotificationDocument> {
  findUnreadForUser(userId: string): Promise<INotificationDocument[]>;
  findUnreadForAdmin(): Promise<INotificationDocument[]>;
  createUserNotification(userId: string, title: string, body: string, meta?: any): Promise<INotificationDocument>;
  createAdminNotification(title: string, body: string, meta?: any): Promise<INotificationDocument>;
  markAllReadForUser(userId: string): Promise<any>;
  markAllReadForAdmin(): Promise<any>;
  deleteOldNotifications(daysOld?: number): Promise<any>;
}
