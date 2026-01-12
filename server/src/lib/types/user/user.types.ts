import mongoose, { Document, Model } from "mongoose";
import { TAuthProvider, TUserStatus, TMfaMethod } from "../auth/auth.types.js";
import { TSystemRole } from "../../consts/roles/roles.consts.js";
import { TPermission } from "../../consts/permissions/permissions.consts.js";

// ---------------- Auth Sub Types ----------------

export type TUserProvider ={
  provider: TAuthProvider;
  providerUserId?: string; // google sub id, sso user id
  email?: string; // provider email (may differ)
  isPrimary: boolean;
  linkedAt: Date;
  lastUsedAt?: Date;
};

export type TUserAuth = {
  providers: TUserProvider[];

  // LOCAL only
  passwordHash?: string;
  passwordUpdatedAt?: Date;

  // MFA
  mfaEnabled: boolean;
  mfaMethod: TMfaMethod;

  // session security
  lastLoginAt?: Date;
  failedLoginCount: number;
  lockedUntil?: Date;
};

export type TPermissionOverrides = {
  allow: readonly TPermission[];
  deny: readonly TPermission[];
};

// ---------------- Base Interface ----------------
export interface IUser {
  orgId: mongoose.Types.ObjectId;

  userId: string; // business id

  // Identity
  email: string; // unique globally among non-deleted
  mobile?: string;
  name: string;
  avatarUrl?: string;

  // Auth (multi-provider)
  auth: TUserAuth;

  // Access Control
  roles: TSystemRole[]; // ✅ recommended (since you have SYSTEM_ROLES const)
  orgScopes: mongoose.Types.ObjectId[]; // orgs user can access (if not global)
  branchScopes: mongoose.Types.ObjectId[]; // optional branch restriction
  globalScope: boolean; // true only for Techentia users

  permissionOverrides: TPermissionOverrides;

  // Status
  status: TUserStatus;
  isDeleted: boolean;
  deletedAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

// ---------------- Document Interface ----------------
export interface IUserDocument extends IUser, Document {
  // lifecycle
  markSuspended(): Promise<IUserDocument>;
  markActive(): Promise<IUserDocument>;
  lock(minutes: number): Promise<IUserDocument>;
  unlock(): Promise<IUserDocument>;
  softDelete(): Promise<IUserDocument>;

  // auth providers
  linkProvider(input: {
    provider: TAuthProvider;
    providerUserId?: string;
    email?: string;
    makePrimary?: boolean;
  }): Promise<IUserDocument>;

  unlinkProvider(provider: TAuthProvider): Promise<IUserDocument>;

  setPassword(passwordHash: string): Promise<IUserDocument>;
  removePassword(): Promise<IUserDocument>;

  recordLogin(provider: TAuthProvider): Promise<IUserDocument>;
  recordFailedLogin(): Promise<IUserDocument>;

  // scope helpers
  hasOrgAccess(orgId: string | mongoose.Types.ObjectId): boolean;
  hasBranchAccess(branchId: string | mongoose.Types.ObjectId): boolean;

  // virtuals
  statusLabel: string;
  isLocked: boolean;
  primaryProvider: TAuthProvider | null;
}

// ---------------- Model Interface ----------------
export interface IUserModel extends Model<IUserDocument> {
  findActiveByEmail(email: string): Promise<IUserDocument | null>;
  findActiveByUserId(userId: string): Promise<IUserDocument | null>;
  findByProvider(provider: TAuthProvider, providerUserId: string): Promise<IUserDocument | null>;
  findOrgUsers(orgId: mongoose.Types.ObjectId): Promise<IUserDocument[]>;
}
