"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useCallback } from "react";
import toast from "react-hot-toast";
import { authAPI } from "@/lib/api";
import { LoginRequest, RegisterRequest, VerifyOTPRequest, ForgotPasswordRequest, ResetPasswordRequest, InitiateChangePasswordRequest, CompleteChangePasswordRequest, OtpPurpose, UserRole, } from "@/lib/types";

// Query key factory for better cache management
export const authKeys = {
  all: ["auth"],
  user: () => [...authKeys.all, "user"],
  currentUser: () => [...authKeys.user(), "current"],
};

export const useAuth = () => {
  const queryClient = useQueryClient();

  // Fetch current user from server (HTTP-only cookies)
  const { data: user, isLoading, refetch: refreshUser, isError, error, } = useQuery({
    queryKey: authKeys.currentUser(),
    queryFn: async () => {
      const res = await authAPI.getCurrentUser();
      if (res.success && res.data) return res.data;
      return null;
    },
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Memoized computed values
  const isAuthenticated = useMemo(() => !!user, [user]);
  const isAdmin = useMemo(
    () => !!user?.isAdmin || user?.role === UserRole.ADMIN,
    [user]
  );

  const hasRole = useCallback(
    (role: UserRole) => {
      if (!user) return false;
      const hierarchy = {
        [UserRole.USER]: 1,
        [UserRole.SELLER]: 2,
        [UserRole.DELIVERY_BOY]: 2,
        [UserRole.ADMIN]: 3,
      };
      return (hierarchy[user.role] || 0) >= (hierarchy[role] || 0);
    },
    [user]
  );

  // Private routes
  const privateRoutes = useMemo(() => ["/profile", "/settings", "/admin", "/user"], []);
  const isPrivate = useCallback((path: string) => privateRoutes.some((route) => path.startsWith(route)), [privateRoutes]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginRequest) => authAPI.login(data),
    onSuccess: async (res) => {
      if (res.success && res.data?.user) {
        queryClient.removeQueries({ queryKey: authKeys.all });
        await queryClient.refetchQueries({ queryKey: ["cart"] });
        await queryClient.refetchQueries({ queryKey: ["addresses"] });
        await queryClient.refetchQueries({ queryKey: ["orders"] });
        await queryClient.refetchQueries({ queryKey: ["userProfile"] });
        toast.success("Logged in successfully");
      } else if (res.data?.requires2FA) {
        toast.success("OTP sent for verification");
      } else {
        toast.error(res.message || "Login failed");
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Login failed");
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterRequest) => authAPI.register(data),
    onSuccess: async (res) => {
      if (res.success) {
        await queryClient.refetchQueries({ queryKey: ["userProfile"] });
        toast.success(res.message || "Registered successfully");
      } else {
        toast.error(res.message || "Registration failed");
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Registration failed");
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => authAPI.logout(),
    onSuccess: () => {
      // Clear all auth-related cache
      queryClient.setQueryData(authKeys.currentUser(), null);
      queryClient.removeQueries({ queryKey: authKeys.all });
      queryClient.removeQueries({ queryKey: ["cart"] });
      queryClient.removeQueries({ queryKey: ["addresses"] });
      queryClient.removeQueries({ queryKey: ["orders"] });
      queryClient.removeQueries({ queryKey: ["userProfile"] });
      toast.success("Logged out successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Logout failed");
    },
  });

  // OTP verification
  const verifyOTPMutation = useMutation({
    mutationFn: async (data: VerifyOTPRequest) => authAPI.verifyOTP(data),
    onSuccess: async (res) => {
      if (res.success && res.data?.user) {
        // Optimistically update cache
        queryClient.removeQueries({ queryKey: authKeys.all });
        await queryClient.refetchQueries({ queryKey: ["cart"] });
        await queryClient.refetchQueries({ queryKey: ["addresses"] });
        await queryClient.refetchQueries({ queryKey: ["orders"] });
        await queryClient.refetchQueries({ queryKey: ["userProfile"] });
        toast.success("OTP verified successfully");
      } else if (res.success) {
        toast.success("OTP verified");
      } else {
        toast.error(res.message || "OTP verification failed");
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "OTP verification failed");
    },
  });

  // Resend OTP
  const resendOTPMutation = useMutation({
    mutationFn: async ({
      identifier,
      purpose,
    }: {
      identifier: string;
      purpose: OtpPurpose;
    }) => authAPI.resendOTP({ identifier, purpose }),
    onSuccess: (res) => {
      if (res.success) {
        toast.success(res.message || "OTP resent successfully");
      } else {
        toast.error(res.message || "Failed to resend OTP");
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Resend OTP failed");
    },
  });

  // Forgot password
  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordRequest) =>
      authAPI.forgotPassword(data),
    onSuccess: (res) => {
      if (res.success) {
        toast.success(res.message || "Password reset link sent");
      } else {
        toast.error(res.message || "Failed to send reset link");
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Forgot password failed");
    },
  });

  // Reset password
  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordRequest) =>
      authAPI.resetPassword(data),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("Password reset successfully");
      } else {
        toast.error(res.message || "Failed to reset password");
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Reset password failed");
    },
  });

  // Initiate change password
  const initiateChangePasswordMutation = useMutation({
    mutationFn: async (data: InitiateChangePasswordRequest) =>
      authAPI.initiateChangePassword(data),
    onSuccess: (res) => {
      if (res.success) {
        toast.success(res.message || "OTP sent for password change");
      } else {
        toast.error(res.message || "Failed to initiate password change");
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Initiate password change failed");
    },
  });

  // Complete change password
  const completeChangePasswordMutation = useMutation({
    mutationFn: async (data: CompleteChangePasswordRequest) =>
      authAPI.completeChangePassword(data),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("Password changed successfully");
      } else {
        toast.error(res.message || "Failed to change password");
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Complete password change failed");
    },
  });

  return {
    // User state
    user,
    isAuthenticated,
    isAdmin,
    hasRole,
    isPrivate,
    isLoading,
    isError,
    error,

    // Actions
    refreshUser,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    verifyOTP: verifyOTPMutation.mutateAsync,
    resendOTP: resendOTPMutation.mutateAsync,
    forgotPassword: forgotPasswordMutation.mutateAsync,
    resetPassword: resetPasswordMutation.mutateAsync,
    initiateChangePassword: initiateChangePasswordMutation.mutateAsync,
    completeChangePassword: completeChangePasswordMutation.mutateAsync,

    // Loading states
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isVerifyingOTP: verifyOTPMutation.isPending,
  };
};
