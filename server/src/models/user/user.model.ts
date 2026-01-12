import { model, Schema } from "mongoose";
import { IUserDocument, IUserModel } from "../../lib/types/user/user.types.js";
import { userModelUtils } from "./user.utils.js";
import { AUTH_PROVIDERS, USER_STATUS, MFA_METHODS } from "../../lib/types/auth/auth.types.js";
import { SYSTEM_ROLES } from "../../lib/consts/roles/roles.consts.js";

const providerSchema = new Schema(
  {
    provider: { type: String, required: true, enum: AUTH_PROVIDERS },
    providerUserId: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    isPrimary: { type: Boolean, default: false },
    linkedAt: { type: Date, required: true, default: () => new Date() },
    lastUsedAt: { type: Date },
  },
  { _id: false }
);

const userSchema = new Schema<IUserDocument, IUserModel>(
  {
    orgId: { type: Schema.Types.ObjectId, required: true, index: true },

    userId: { type: String, required: [true, "User ID is missing"], trim: true, index: true },

    // Identity
    email: { type: String, required: [true, "Email is missing"], trim: true, lowercase: true, index: true },
    mobile: { type: String, trim: true },
    name: { type: String, required: [true, "Name is missing"], trim: true },
    avatarUrl: { type: String, trim: true },

    // Auth
    auth: {
      providers: { type: [providerSchema], default: [] },

      passwordHash: { type: String },
      passwordUpdatedAt: { type: Date },

      mfaEnabled: { type: Boolean, default: false },
      mfaMethod: { type: String, enum: MFA_METHODS, default: "NONE" },

      lastLoginAt: { type: Date },
      failedLoginCount: { type: Number, default: 0, min: 0 },
      lockedUntil: { type: Date },
    },

    // Access Control
    roles: { type: [String], enum: SYSTEM_ROLES, default: [], index: true },

    orgScopes: [{ type: Schema.Types.ObjectId, ref: "Organization", default: [] }],
    branchScopes: [{ type: Schema.Types.ObjectId, ref: "Branch", default: [] }],

    globalScope: { type: Boolean, default: false, index: true },

    permissionOverrides: {
      allow: { type: [String], default: [] },
      deny: { type: [String], default: [] },
    },

    // Status
    status: { type: String, required: true, enum: USER_STATUS, default: "INVITED", index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// ---------------- Indexes ----------------

// Email unique globally among non-deleted users
userSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

// userId unique globally among non-deleted users
userSchema.index(
  { userId: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

// Embedded provider uniqueness (GOOGLE/SSO providerUserId unique globally)
userSchema.index(
  { "auth.providers.provider": 1, "auth.providers.providerUserId": 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: {
      isDeleted: false,
      "auth.providers.providerUserId": { $type: "string" },
    },
  }
);

// Common filter index
userSchema.index({ orgId: 1, isDeleted: 1, status: 1 });

// ---------------- Hooks (Global invariants) ----------------
userSchema.pre("validate", function () {
  // normalize email
  if (this.email) this.email = this.email.toLowerCase().trim();

  // deleted users must be suspended
  if (this.isDeleted) {
    this.status = "SUSPENDED";
    if (!this.deletedAt) this.deletedAt = new Date();
  }

  // must have at least 1 provider
  const providers = this.auth?.providers || [];
  if (providers.length === 0) {
    throw new Error("User must have at least 1 auth provider");
  }

  // exactly one primary provider
  const primaryCount = providers.filter((p) => p.isPrimary).length;
  if (primaryCount !== 1) throw new Error("User must have exactly 1 primary auth provider");

  // provider invariants
  for (const p of providers) {
    // GOOGLE/SSO requires providerUserId
    if ((p.provider === "GOOGLE" || p.provider === "SSO") && !p.providerUserId) {
      throw new Error(`${p.provider} provider requires providerUserId`);
    }
  }

  // if LOCAL exists then passwordHash must exist
  const hasLocal = providers.some((p) => p.provider === "LOCAL");
  if (hasLocal && !this.auth.passwordHash) {
    throw new Error("LOCAL provider exists but passwordHash is missing");
  }

  // globalScope users: orgScopes & branchScopes must be empty
  if (this.globalScope) {
    if (this.orgScopes?.length) this.orgScopes = [];
    if (this.branchScopes?.length) this.branchScopes = [];
  } else {
    // non-global must have >= 1 org scope
    if (!this.orgScopes || this.orgScopes.length === 0) {
      throw new Error("Non-global user must have at least 1 orgScope");
    }
  }
});

// ---------------- Methods & Statics ----------------
userSchema.methods = userModelUtils.methods;
userSchema.statics = userModelUtils.statics;

// ---------------- Virtuals ----------------
Object.entries(userModelUtils.virtuals).forEach(([name, getter]) => {
  userSchema.virtual(name).get(getter);
});

export const User: IUserModel = model<IUserDocument, IUserModel>("User", userSchema);