// @/lib/utils/server/email.server.utils.ts

import { ApiResponse, AppError } from "@/lib/types";
import axios, { AxiosResponse } from "axios";

export const emailUtils = {
    async sendOTP(email: string, otp: string, purpose: string): Promise<void> {
        const res: AxiosResponse<ApiResponse<any>> = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/send-otp`, { identifier: email, otp, purpose, });

        if (!res.data.success) {
            throw new AppError(`Failed to send OTP ${res.data.error}`, 400);
        }

        console.log(`📧 OTP sent to email: ${email}`);
        console.log(`🔐 OTP for ${email}: ${otp}`);
    },

    getSubject(purpose: string): string {
        switch (purpose) {
            case "register":
                return "Email Verification - Complete Registration";
            case "login":
                return "Two-Factor Authentication - Login Verification";
            case "forgot_password":
                return "Password Reset Verification";
            case "change_password":
                return "Password Change Verification";
            default:
                return "Verification Code";
        }
    },

    generateEmailTemplate(otp: string, purpose: string): string {
        const purposeText = this.getPurposeText(purpose);
        const instructions = this.getInstructions(purpose);

        return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verification Code</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; color: white; text-align: center; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 28px;">${process.env.APP_NAME || 'Your App'}</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">${purposeText}</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h2 style="margin: 0 0 20px 0; color: #333;">Your Verification Code</h2>
          <div style="background: white; padding: 25px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
            <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #667eea; font-family: 'Courier New', monospace;">
              ${otp}
            </div>
          </div>
          <p style="color: #666; margin: 20px 0 0 0;">
            <strong>This code will expire in 10 minutes</strong>
          </p>
        </div>
        
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h3 style="margin: 0 0 15px 0; color: #856404;">Important Instructions:</h3>
          <p style="margin: 0; color: #856404;">${instructions}</p>
        </div>
        
        <div style="text-align: center; color: #666; font-size: 14px;">
          <p>If you didn't request this code, please ignore this email.</p>
          <p>For security reasons, do not share this code with anyone.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p>© ${new Date().getFullYear()} ${process.env.APP_NAME || 'Your App'}. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
    },

    getPurposeText(purpose: string): string {
        switch (purpose) {
            case "register":
                return "Complete your account registration";
            case "login":
                return "Two-factor authentication required";
            case "forgot_password":
                return "Reset your account password";
            case "change_password":
                return "Verify password change request";
            default:
                return "Account verification required";
        }
    },

    getInstructions(purpose: string): string {
        switch (purpose) {
            case "register":
                return "Enter this code to complete your account registration and verify your email address.";
            case "login":
                return "Enter this code to complete your login. This is required because you have two-factor authentication enabled.";
            case "forgot_password":
                return "Enter this code to verify your identity and proceed with password reset.";
            case "change_password":
                return "Enter this code to confirm your password change request.";
            default:
                return "Enter this code to verify your identity and proceed.";
        }
    },
};
