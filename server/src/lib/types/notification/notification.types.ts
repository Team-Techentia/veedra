// @/types/notification.types.ts
import { TSystemRole } from "../../consts/roles/roles.consts.js";
import { NotificationChannel, NotificationPriority, NotificationType } from "./notification.enums.js";

export interface NotificationPayload {
  type: NotificationType;
  channels: NotificationChannel[];
  priority: NotificationPriority;
  
  // Recipients
  recipients: {
    userId?: string;
    userIds?: string[];
    role?: TSystemRole;
    roles?: TSystemRole[];
    branchId?: string;
    email?: string;
    mobile?: string;
  };
  
  // Content
  subject?: string;
  templateId?: string;
  templateData?: Record<string, any>;
  customMessage?: string;
  
  // Metadata
  metadata?: {
    resourceType?: string;
    resourceId?: string;
    branchId?: string;
    triggeredBy?: string;
    expiresAt?: Date;
  };
  
  // Scheduling
  scheduledFor?: Date;
  
  // Options
  options?: {
    emailOptions?: EmailOptions;
    pushOptions?: PushOptions;
    smsOptions?: SMSOptions;
  };
}

export interface EmailOptions {
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
}

export interface PushOptions {
  badge?: number;
  sound?: string;
  clickAction?: string;
  data?: Record<string, any>;
}

export interface SMSOptions {
  senderId?: string;
}

export interface NotificationPreferences {
  userId: string;
  channels: {
    [key in NotificationChannel]?: boolean;
  };
  typePreferences: {
    [key in NotificationType]?: {
      enabled: boolean;
      channels: NotificationChannel[];
    };
  };
  quietHours?: {
    enabled: boolean;
    start: string; // "22:00"
    end: string;   // "08:00"
    timezone: string;
  }; 
}