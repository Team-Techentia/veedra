// lib/types/auth/auth.types.ts
import { Request } from "express"
import { TSystemRole } from "../../consts/roles/roles.consts.js";
import { TPermission } from "../../consts/permissions/permissions.consts.js";

// AUTH CONFIG CONSTANTS
export const AUTH_PROVIDERS = ["LOCAL", "GOOGLE", "OTP", "SSO"] as const;
export type TAuthProvider = (typeof AUTH_PROVIDERS)[number];

export const USER_STATUS = ["ACTIVE", "INVITED", "SUSPENDED"] as const;
export type TUserStatus = (typeof USER_STATUS)[number];

export const MFA_METHODS = ["NONE", "APP", "SMS", "EMAIL"] as const;
export type TMfaMethod = (typeof MFA_METHODS)[number];

export const SESSION_TYPES = ["ACCESS", "REFRESH"] as const;
export type TSessionType = (typeof SESSION_TYPES)[number];

export interface AuthRequest extends Request {
    user?: AuthUser;
    branchId?: string;
    permissions?: ReadonlySet<TPermission>;
}

export type AccessTokenPayload = {
  typ: "ACCESS";
  sub: string;               // userId (mongodb _id as string)
  userId: string;            // business userId
  orgId: string;             // current org context (selected org)
  branchId?: string;         // optional current branch context
  roles: TSystemRole[];      // roles assigned
  globalScope: boolean;

  allow?: TPermission[];     // overrides (optional)
  deny?: TPermission[];

  sessionId: string;         // for revocation if needed
  iat: number;
  exp: number;
};

export type AuthUser = AccessTokenPayload & {
  _id: string; // MongoDB _id (stringified)
};

export type RefreshTokenPayload = {
  typ: "REFRESH";
  sub: string;        // user _id
  sessionId: string;  // ties to server-side session (DB/redis)
  iat: number;
  exp: number;
};