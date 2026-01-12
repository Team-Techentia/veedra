export enum UserRole {
  ADMIN = "ADMIN",
  USER = "USER",
  SELLER = "SELLER",
  DELIVERY_BOY = "DELIVERY_BOY",
}

export enum OtpPurpose {
  REGISTER = "register",
  LOGIN = "login",
  FORGOT_PASSWORD = "forgot_password",
  CHANGE_PASSWORD = "change_password"
}

export enum UserAccountStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification'
}