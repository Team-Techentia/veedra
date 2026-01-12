// // @/services/notification/providers/push.provider.ts
// import admin from 'firebase-admin';
// import { NotificationPreference, NotificationTemplate } from '../../../../models/index.js';
// import { NotificationChannel } from '../../../types/index.js';

// export class PushProvider {
//   private messaging: admin.messaging.Messaging;
  
//   constructor() {
//     if (!admin.apps.length) {
//       admin.initializeApp({
//         credential: admin.credential.cert({
//           projectId: process.env.FIREBASE_PROJECT_ID,
//           clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
//           privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
//         })
//       });
//     }
//     this.messaging = admin.messaging();
//   }
  
//   async send(data: any): Promise<any> {
//     // 1. Get user's push tokens
//     const prefs = await NotificationPreference.findOne({
//       userId: data.recipientId
//     });
    
//     if (!prefs || !prefs.pushTokens.length) {
//       throw new Error('No push tokens found for user');
//     }
    
//     // 2. Load template
//     const template = await NotificationTemplate.findOne({
//       templateId: data.templateId
//     });
    
//     const pushTemplate = template.channels[NotificationChannel.PUSH];
//     const titleTemplate = handlebars.compile(pushTemplate.titleTemplate);
//     const bodyTemplate = handlebars.compile(pushTemplate.bodyTemplate);
    
//     const title = titleTemplate(data.templateData);
//     const body = bodyTemplate(data.templateData);
    
//     // 3. Send to all tokens
//     const tokens = prefs.pushTokens.map(t => t.token);
    
//     const message: admin.messaging.MulticastMessage = {
//       notification: { title, body },
//       data: {
//         notificationId: data.notificationId,
//         type: data.type,
//         ...data.options?.pushOptions?.data
//       },
//       tokens,
//       android: {
//         priority: 'high',
//         notification: {
//           sound: data.options?.pushOptions?.sound || 'default'
//         }
//       },
//       apns: {
//         payload: {
//           aps: {
//             badge: data.options?.pushOptions?.badge,
//             sound: data.options?.pushOptions?.sound || 'default'
//           }
//         }
//       }
//     };
    
//     const result = await this.messaging.sendMulticast(message);
    
//     // Remove invalid tokens
//     if (result.failureCount > 0) {
//       const failedTokens: string[] = [];
//       result.responses.forEach((resp, idx) => {
//         if (!resp.success) {
//           failedTokens.push(tokens[idx]);
//         }
//       });
      
//       await NotificationPreference.updateOne(
//         { userId: data.recipientId },
//         { $pull: { pushTokens: { token: { $in: failedTokens } } } }
//       );
//     }
    
//     return {
//       successCount: result.successCount,
//       failureCount: result.failureCount
//     };
//   }
// }