// @/lib/config/db/models/notification.model.ts
import { Schema, model, models } from "mongoose";
import { INotificationDocument, INotificationModel } from "../../types";

const NotificationSchema = new Schema<INotificationDocument, INotificationModel>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", },
    isForAdmin: { type: Boolean, default: false, },
    title: { type: String, required: [true, 'Title is required'], trim: true, minlength: [1, 'Title cannot be empty'], maxlength: [200, 'Title cannot exceed 200 characters'] },
    body: { type: String, required: [true, 'Body is required'], trim: true, minlength: [1, 'Body cannot be empty'], maxlength: [1000, 'Body cannot exceed 1000 characters'] },
    read: { type: Boolean, default: false, },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, toJSON: { virtuals: true, }, toObject: { virtuals: true } }
);

// Compound indexes for efficient queries
NotificationSchema.index({ user: 1, createdAt: -1 });
NotificationSchema.index({ user: 1, read: 1 });
NotificationSchema.index({ isForAdmin: 1, createdAt: -1 });
NotificationSchema.index({ isForAdmin: 1, read: 1 });
NotificationSchema.index({ createdAt: -1 });

// Virtual fields
NotificationSchema.virtual('isUnread').get(function () {
  return !this.read;
});

NotificationSchema.virtual('age').get(function () {
  return Date.now() - this.createdAt.getTime();
});

NotificationSchema.virtual('isRecent').get(function () {
  const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
  return this.createdAt.getTime() > oneDayAgo;
});

// Pre-save middleware
NotificationSchema.pre('save', function () {
  // Validate that either user or isForAdmin is set, but not both
  if (!this.user && !this.isForAdmin) {
    throw new Error('Notification must be for a user or for admin');
  }

  if (this.user && this.isForAdmin) {
    throw new Error('Notification cannot be for both user and admin');
  }
});

// Static methods
NotificationSchema.statics.findUnreadForUser = function (userId: string) {
  return this.find({ user: userId, read: false }).sort({ createdAt: -1 });
};

NotificationSchema.statics.findUnreadForAdmin = function () {
  return this.find({ isForAdmin: true, read: false }).sort({ createdAt: -1 });
};

NotificationSchema.statics.createUserNotification = async function (
  userId: string,
  title: string,
  body: string,
  meta?: any
) {
  return this.create({
    user: userId,
    title,
    body,
    meta: meta || {}
  });
};

NotificationSchema.statics.createAdminNotification = async function (
  title: string,
  body: string,
  meta?: any
) {
  return this.create({
    isForAdmin: true,
    title,
    body,
    meta: meta || {}
  });
};

NotificationSchema.statics.markAllReadForUser = async function (userId: string) {
  return this.updateMany(
    { user: userId, read: false },
    { read: true }
  );
};

NotificationSchema.statics.markAllReadForAdmin = async function () {
  return this.updateMany(
    { isForAdmin: true, read: false },
    { read: true }
  );
};

NotificationSchema.statics.deleteOldNotifications = async function (daysOld = 30) {
  const cutoffDate = new Date(Date.now() - (daysOld * 24 * 60 * 60 * 1000));
  return this.deleteMany({ createdAt: { $lt: cutoffDate } });
};

// Instance methods
NotificationSchema.methods.markAsRead = async function () {
  this.read = true;
  return this.save();
};

NotificationSchema.methods.markAsUnread = async function () {
  this.read = false;
  return this.save();
};

const Notification = (models?.Notification as INotificationModel) ||
  model<INotificationDocument, INotificationModel>("Notification", NotificationSchema);

export default Notification;