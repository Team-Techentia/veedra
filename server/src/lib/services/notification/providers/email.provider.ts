// @/services/notification/providers/email.provider.ts
import nodemailer from 'nodemailer';
import { NotificationTemplate } from '../../../../models/index.js';
import { NotificationChannel } from '../../../types/index.js';
import Handlebars from 'handlebars';
// import handlebars from 'handlebars';

export class EmailProvider {
  private transporter: nodemailer.Transporter;
  
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  

  async send(data: any): Promise<any> {
    // 1. Load template
    const template = await NotificationTemplate.findOne({
      templateId: data.templateId
    });
    
    if (!template) {
      throw new Error(`Template ${data.templateId} not found`);
    }
    
    // 2. Compile template
    const emailTemplate = template.channels?.[NotificationChannel.EMAIL];
    const subjectTemplate = Handlebars.compile(emailTemplate?.subjectTemplate);
    const htmlTemplate = Handlebars.compile(emailTemplate?.htmlTemplate);
    
    const subject = subjectTemplate(data.templateData);
    const html = htmlTemplate(data.templateData);
    
    // 3. Send email
    const result = await this.transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: data.recipientEmail,
      subject,
      html,
      attachments: data.options?.emailOptions?.attachments,
      cc: data.options?.emailOptions?.cc,
      bcc: data.options?.emailOptions?.bcc,
      replyTo: data.options?.emailOptions?.replyTo
    });
    
    return {
      messageId: result.messageId,
      accepted: result.accepted,
      rejected: result.rejected
    };
  }
}