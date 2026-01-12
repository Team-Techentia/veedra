// // @/services/notification/providers/sms.provider.ts
// import twilio from 'twilio';
// import { NotificationTemplate } from '../../../../models/index.js';
// import { NotificationChannel } from '../../../types/index.js';

// export class SMSProvider {
//   private client: twilio.Twilio;
  
//   constructor() {
//     this.client = twilio(
//       process.env.TWILIO_ACCOUNT_SID,
//       process.env.TWILIO_AUTH_TOKEN
//     );
//   }
  
//   async send(data: any): Promise<any> {
//     if (!data.recipientMobile) {
//       throw new Error('Mobile number required for SMS');
//     }
    
//     // Load template
//     const template = await NotificationTemplate.findOne({
//       templateId: data.templateId
//     });
    
//     const smsTemplate = template.channels[NotificationChannel.SMS];
//     const bodyTemplate = handlebars.compile(smsTemplate.bodyTemplate);
//     const body = bodyTemplate(data.templateData);
    
//     // Send SMS
//     const result = await this.client.messages.create({
//       body,
//       from: process.env.TWILIO_PHONE_NUMBER,
//       to: data.recipientMobile
//     });
    
//     return {
//       messageId: result.sid,
//       status: result.status
//     };
//   }
// }