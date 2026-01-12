// @/lib/api/auth.ts
import { CompleteChangePasswordRequest, ForgotPasswordRequest, ForgotPasswordResponse, InitiateChangePasswordRequest, InitiateChangePasswordResponse, LoginRequest, LoginResponse, OTPVerificationResponse, RefreshTokenResponse, RegisterRequest, RegisterResponse, ResendOTPRequest, ResetPasswordRequest, TokenValidationResponse, UpdateProfileRequest, VerifyOTPRequest, } from "@/lib/types";
import axiosClient from "../client/axios";
import { AuthenticatedUser, } from "@/lib/types";

export const authAPI = {
  register: (data: RegisterRequest) => axiosClient.post<RegisterResponse>("/api/auth/register", data),
  login: (data: LoginRequest) => axiosClient.post<LoginResponse>("/api/auth/login", data),
  logout: () => axiosClient.post<{ message: string }>("/api/auth/logout"),
  forgotPassword: (data: ForgotPasswordRequest) => axiosClient.post<ForgotPasswordResponse>("/api/auth/forgot-password", data),
  initiateChangePassword: (data: InitiateChangePasswordRequest) => axiosClient.post<InitiateChangePasswordResponse>("/api/auth/change-password/initiate", data),
  completeChangePassword: (data: CompleteChangePasswordRequest) => axiosClient.post<{ message: string }>("/api/auth/change-password/complete", data),
  resetPassword: (data: ResetPasswordRequest) => axiosClient.post<{ message: string }>("/api/auth/reset-password", data),

  // User management
  getCurrentUser: () => axiosClient.get<AuthenticatedUser>("/api/auth/me"),
  updateProfile: (data: UpdateProfileRequest) => axiosClient.patch<AuthenticatedUser>("/api/auth/profile", data),

  // Token management
  refreshToken: () => axiosClient.post<RefreshTokenResponse>("/api/auth/refresh"),
  validateToken: () => axiosClient.post<TokenValidationResponse>("/api/auth/validate-token"),

  // OTP management
  verifyOTP: (data: VerifyOTPRequest) => axiosClient.post<OTPVerificationResponse>("/api/auth/verify-otp", data),
  resendOTP: (data: ResendOTPRequest) => axiosClient.post<{ message: string }>("/api/auth/resend-otp", data),
};

export default authAPI;