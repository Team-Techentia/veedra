// @/lib/interfaces/auth.interfaces.ts

import { OtpPurpose, UserRole } from "./auth.enums";
import { AuthenticatedUser } from "./auth.types";

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  password: string;
  role?: UserRole;
}

export interface LoginRequest {
  email?: string;
  phone?: string;
  password: string;
}

export interface VerifyOTPRequest {
  identifier: string;
  otp: string;
  purpose: OtpPurpose;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  resetToken: string;
  newPassword: string;
  identifier: string;
}

export interface InitiateChangePasswordRequest {
  currentPassword: string;
}

export interface CompleteChangePasswordRequest {
  identifier: string;  // can be email or phone
  newPassword: string;
  changeToken: string;
}

export interface ResendOTPRequest {
  identifier: string;
  purpose: OtpPurpose;
}

export interface UpdateProfileRequest {
  firstName?: string;
  walletAddress?: string;
}

export interface JWTPayload {
    sub: string;
    _id: string;
    email?: string;
    phone?: string;
    role?: string;
    isAdmin?: boolean;
    iat: number;
    exp: number;
}

// Auth response interfaces based on actual API responses
export interface LoginResponse {
  user?: AuthenticatedUser;
  token?: string;
  requires2FA?: boolean;
  identifier?: string;
}

export interface OTPVerificationResponse {
  user?: AuthenticatedUser;
  token?: string;
  resetToken?: string;
  changeToken?: string;
}

export interface RegisterResponse {
  identifier: string;
  purpose: OtpPurpose;
  message?: string;
}

export interface InitiateChangePasswordResponse {
  identifier: string;
  purpose: OtpPurpose;
  message?: string;
}

export interface ForgotPasswordResponse {
  identifier: string;
  purpose: OtpPurpose;
  message?: string;
}

export interface RefreshTokenResponse {
  token: string;
  user: AuthenticatedUser;
}

export interface TokenValidationResponse {
  valid: boolean;
  user?: AuthenticatedUser;
  message?: string;
}
