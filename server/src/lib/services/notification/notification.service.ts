// @/services/notification/notification.service.ts
import Bull from 'bull';
import { nanoid } from 'nanoid';
import { AppError, NotificationChannel, NotificationPayload, NotificationPreferences, NotificationPriority, NotificationStatus, NotificationType } from '../../types/index.js';
import { Notification, NotificationPreference, User } from '../../../models/index.js';
import { EmailProvider } from './providers/email.provider.js';
import { TSystemRole } from '../../consts/roles/roles.consts.js';

export class NotificationService {
  private emailQueue: Bull.Queue;
  private pushQueue: Bull.Queue;
  private smsQueue: Bull.Queue;

  constructor() {
    this.emailQueue = new Bull('email-notifications', {
      redis: process.env.REDIS_URL
    });

    this.pushQueue = new Bull('push-notifications', {
      redis: process.env.REDIS_URL
    });

    this.smsQueue = new Bull('sms-notifications', {
      redis: process.env.REDIS_URL
    });

    this.setupQueueProcessors();
  }

  /**
   * Main entry point for sending notifications
   */
  async send(payload: NotificationPayload): Promise<string[]> {
    // 1. Resolve recipients
    const recipients = await this.resolveRecipients(payload.recipients);

    if (recipients.length === 0) {
      throw new AppError('No valid recipients found', 400);
    }

    // 2. Create notification records
    const notificationIds: string[] = [];

    for (const recipient of recipients) {
      // Check user preferences
      const preferences = await this.getUserPreferences(recipient.userId);
      const allowedChannels = this.filterChannelsByPreference(
        payload.channels,
        payload.type,
        preferences
      );

      if (allowedChannels.length === 0) continue;

      // Check quiet hours
      if (this.isInQuietHours(preferences)) {
        if (payload.priority !== NotificationPriority.CRITICAL) {
          // Schedule for after quiet hours
          payload.scheduledFor = this.calculateQuietHoursEnd(preferences);
        }
      }

      // Create notification record
      const notification = await Notification.create({
        notificationId: nanoid(),
        type: payload.type,
        priority: payload.priority,
        status: payload.scheduledFor
          ? NotificationStatus.PENDING
          : NotificationStatus.QUEUED,
        recipientId: recipient.userId,
        recipientEmail: recipient.email,
        recipientMobile: recipient.mobile,
        subject: payload.subject,
        templateId: payload.templateId,
        templateData: payload.templateData,
        channels: allowedChannels.map(channel => ({
          channel,
          status: NotificationStatus.PENDING,
          retryCount: 0
        })),
        metadata: payload.metadata,
        scheduledFor: payload.scheduledFor,
        expiresAt: payload.metadata?.expiresAt
      });

      notificationIds.push(notification.notificationId);

      // 3. Queue for processing (unless scheduled)
      if (!payload.scheduledFor) {
        await this.queueNotification(notification, payload.options);
      }
    }

    return notificationIds;
  }

  /**
   * Batch send to multiple users
   */
  async sendBatch(payloads: NotificationPayload[]): Promise<string[]> {
    const allIds: string[] = [];

    // Process in chunks to avoid overwhelming the system
    const chunkSize = 100;
    for (let i = 0; i < payloads.length; i += chunkSize) {
      const chunk = payloads.slice(i, i + chunkSize);
      const results = await Promise.allSettled(
        chunk.map(payload => this.send(payload))
      );

      results.forEach(result => {
        if (result.status === 'fulfilled') {
          allIds.push(...result.value);
        }
      });
    }

    return allIds;
  }

  /**
   * Send to all users of a specific role
   */
  async sendToRole(
    role: TSystemRole,
    payload: Omit<NotificationPayload, 'recipients'>
  ): Promise<string[]> {
    return this.send({
      ...payload,
      recipients: { role }
    });
  }

  /**
   * Send to all users in a branch
   */
  async sendToBranch(
    branchId: string,
    payload: Omit<NotificationPayload, 'recipients'>
  ): Promise<string[]> {
    return this.send({
      ...payload,
      recipients: { branchId },
      metadata: {
        ...payload.metadata,
        branchId
      }
    });
  }

  /**
   * Helper: Resolve recipients from various input formats
   */
  private async resolveRecipients(
    recipients: NotificationPayload['recipients']
  ): Promise<Array<{ userId: string; email?: string; mobile?: string }>> {
    const resolved: Array<{
      userId: string;
      email?: string;
      mobile?: string
    }> = [];

    // Single user ID
    if (recipients.userId) {
      const user = await User.findOne({
        userId: recipients.userId,
        isActive: true
      });
      if (user) {
        resolved.push({
          userId: user.userId,
          email: user.email ?? "",
          mobile: user.mobile ?? ""
        });
      }
    }

    // Multiple user IDs
    if (recipients.userIds && recipients.userIds.length > 0) {
      const users = await User.find({
        userId: { $in: recipients.userIds },
        isActive: true
      });
      resolved.push(...users.map(u => ({
        userId: u.userId,
        email: u.email ?? "",
        mobile: u.mobile ?? ""
      })));
    }

    // By role
    if (recipients.role) {
      const users = await User.find({
        role: recipients.role,
        isActive: true
      });
      resolved.push(...users.map(u => ({
        userId: u.userId,
        email: u.email ?? "",
        mobile: u.mobile ?? ""
      })));
    }

    // By multiple roles
    if (recipients.roles && recipients.roles.length > 0) {
      const users = await User.find({
        role: { $in: recipients.roles },
        isActive: true
      });
      resolved.push(...users.map(u => ({
        userId: u.userId,
        email: u.email ?? "",
        mobile: u.mobile ?? ""
      })));
    }

    // By branch
    if (recipients.branchId) {
      const users = await User.find({
        branchId: recipients.branchId,
        isActive: true
      });
      resolved.push(...users.map(u => ({
        userId: u.userId,
        email: u.email ?? "",
        mobile: u.mobile ?? ""
      })));
    }

    // Direct email/mobile (for guests/customers)
    if (recipients.email || recipients.mobile) {
      resolved.push({
        userId: 'guest',
        email: recipients.email,
        mobile: recipients.mobile
      });
    }

    // Deduplicate by userId
    const uniqueMap = new Map();
    resolved.forEach(r => uniqueMap.set(r.userId, r));

    return Array.from(uniqueMap.values());
  }

  /**
   * Queue notification for delivery
   */
  private async queueNotification(
    notification: any,
    options?: NotificationPayload['options']
  ): Promise<void> {
    const priority = this.getPriorityWeight(notification.priority);

    for (const channelInfo of notification.channels) {
      const jobData = {
        notificationId: notification.notificationId,
        channel: channelInfo.channel,
        recipientId: notification.recipientId,
        recipientEmail: notification.recipientEmail,
        recipientMobile: notification.recipientMobile,
        templateId: notification.templateId,
        templateData: notification.templateData,
        subject: notification.subject,
        options
      };

      switch (channelInfo.channel) {
        case NotificationChannel.EMAIL:
          await this.emailQueue.add(jobData, {
            priority,
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 }
          });
          break;

        case NotificationChannel.PUSH:
          await this.pushQueue.add(jobData, {
            priority,
            attempts: 3,
            backoff: { type: 'exponential', delay: 1000 }
          });
          break;

        case NotificationChannel.SMS:
          await this.smsQueue.add(jobData, {
            priority,
            attempts: 2,
            backoff: { type: 'fixed', delay: 5000 }
          });
          break;
      }
    }

    // Update status
    await Notification.updateOne(
      { notificationId: notification.notificationId },
      {
        status: NotificationStatus.QUEUED,
        'channels.$[].status': NotificationStatus.QUEUED
      }
    );
  }

  /**
   * Setup queue processors
   */
  private setupQueueProcessors(): void {
    // Email processor
    this.emailQueue.process(async (job) => {
      const provider = new EmailProvider();
      return provider.send(job.data);
    });

    // // Push processor
    // this.pushQueue.process(async (job) => {
    //   const provider = new PushProvider();
    //   return provider.send(job.data);
    // });

    // // SMS processor
    // this.smsQueue.process(async (job) => {
    //   const provider = new SMSProvider();
    //   return provider.send(job.data);
    // });

    // Handle job completion
    this.emailQueue.on('completed', async (job, result) => {
      await this.updateChannelStatus(
        job.data.notificationId,
        job.data.channel,
        NotificationStatus.SENT,
        result
      );
    });

    // Handle job failure
    this.emailQueue.on('failed', async (job, err) => {
      await this.updateChannelStatus(
        job.data.notificationId,
        job.data.channel,
        NotificationStatus.FAILED,
        { error: err.message }
      );
    });

    // Similar handlers for push and SMS queues...
  }

  /**
   * Update channel delivery status
   */
  private async updateChannelStatus(
    notificationId: string,
    channel: NotificationChannel,
    status: NotificationStatus,
    result?: any
  ): Promise<void> {
    const update: any = {
      'channels.$.status': status,
      updatedAt: new Date()
    };

    if (status === NotificationStatus.SENT) {
      update['channels.$.sentAt'] = new Date();
      update['channels.$.externalId'] = result?.messageId;
    } else if (status === NotificationStatus.FAILED) {
      update['channels.$.failedAt'] = new Date();
      update['channels.$.errorMessage'] = result?.error;
    }

    await Notification.updateOne(
      {
        notificationId,
        'channels.channel': channel
      },
      update
    );

    // Update overall notification status
    const notification = await Notification.findOne({ notificationId });
    if (notification) {
      const allStatuses = notification.channels.map(c => c.status);

      if (allStatuses.every(s => s === NotificationStatus.SENT)) {
        notification.status = NotificationStatus.SENT;
        notification.processedAt = new Date();
        await notification.save();
      } else if (allStatuses.some(s => s === NotificationStatus.FAILED)) {
        notification.status = NotificationStatus.FAILED;
        await notification.save();
      }
    }
  }

  /**
   * Get user notification preferences
   */
  private async getUserPreferences(
    userId: string
  ): Promise<NotificationPreferences> {
    let prefs = await NotificationPreference.findOne({ userId });

    if (!prefs) {
      // Create default preferences
      prefs = await NotificationPreference.create({
        userId,
        channels: {
          [NotificationChannel.EMAIL]: true,
          [NotificationChannel.PUSH]: true,
          [NotificationChannel.SMS]: false,
          [NotificationChannel.IN_APP]: true
        }
      });
    }

    return prefs.toObject() as any;
  }

  /**
   * Filter channels based on user preferences
   */
  private filterChannelsByPreference(
    requestedChannels: NotificationChannel[],
    type: NotificationType,
    preferences: NotificationPreferences
  ): NotificationChannel[] {
    return requestedChannels.filter(channel => {
      // Check global channel preference
      if (!preferences.channels[channel]) return false;

      // Check type-specific preference
      const typePrefs = preferences.typePreferences?.[type];
      if (typePrefs) {
        if (!typePrefs.enabled) return false;
        if (typePrefs.channels && !typePrefs.channels.includes(channel)) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Check if current time is in user's quiet hours
   */
  private isInQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quietHours?.enabled) return false;

    const now = new Date();
    const tz = preferences.quietHours.timezone;

    // Implementation using date-fns-tz or moment-timezone
    // For brevity, simplified here
    return false;
  }

  /**
   * Calculate when quiet hours end
   */
  private calculateQuietHoursEnd(
    preferences: NotificationPreferences
  ): Date {
    // Implementation to calculate next available time
    return new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours from now
  }

  /**
   * Get priority weight for queue
   */
  private getPriorityWeight(priority: NotificationPriority): number {
    const weights = {
      [NotificationPriority.CRITICAL]: 1,
      [NotificationPriority.HIGH]: 2,
      [NotificationPriority.MEDIUM]: 3,
      [NotificationPriority.LOW]: 4
    };
    return weights[priority] || 3;
  }
}

export const notificationService = new NotificationService();