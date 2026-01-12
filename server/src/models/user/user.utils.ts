import mongoose from "mongoose";
import { IUserDocument, IUserModel } from "../../lib/types/user/user.types.js";
import { TAuthProvider } from "../../lib/types/auth/auth.types.js";

export const userModelUtils = {
  // ---------------- Instance Methods ----------------
  methods: {
    async markSuspended(this: IUserDocument) {
      this.status = "SUSPENDED";
      await this.save();
      return this;
    },

    async markActive(this: IUserDocument) {
      if (this.isDeleted) throw new Error("Deleted user cannot be activated");
      this.status = "ACTIVE";
      await this.save();
      return this;
    },

    async lock(this: IUserDocument, minutes: number) {
      const ms = Math.max(1, minutes) * 60 * 1000;
      this.auth.lockedUntil = new Date(Date.now() + ms);
      await this.save();
      return this;
    },

    async unlock(this: IUserDocument) {
      this.auth.lockedUntil = undefined;
      this.auth.failedLoginCount = 0;
      await this.save();
      return this;
    },

    async softDelete(this: IUserDocument) {
      this.isDeleted = true;
      this.deletedAt = new Date();
      this.status = "SUSPENDED";
      await this.save();
      return this;
    },

    // ---------------- Auth Provider Linking ----------------
    async linkProvider(
      this: IUserDocument,
      input: { provider: TAuthProvider; providerUserId?: string; email?: string; makePrimary?: boolean }
    ) {
      if (this.isDeleted) throw new Error("Cannot link provider to deleted user");

      const { provider, providerUserId, email, makePrimary } = input;

      const existing = this.auth.providers.find((p) => p.provider === provider);

      if (existing) {
        existing.providerUserId = providerUserId ?? existing.providerUserId;
        existing.email = email?.toLowerCase().trim() ?? existing.email;

        if (makePrimary) {
          this.auth.providers.forEach((p) => (p.isPrimary = false));
          existing.isPrimary = true;
        }
      } else {
        if ((provider === "GOOGLE" || provider === "SSO") && !providerUserId) {
          throw new Error(`${provider} provider requires providerUserId`);
        }

        if (makePrimary) this.auth.providers.forEach((p) => (p.isPrimary = false));

        this.auth.providers.push({
          provider,
          providerUserId,
          email: email?.toLowerCase().trim(),
          isPrimary: makePrimary ?? false,
          linkedAt: new Date(),
        } as any);
      }

      // fallback: ensure a primary exists
      if (!this.auth.providers.some((p) => p.isPrimary)) {
        this.auth.providers[0].isPrimary = true;
      }

      await this.save();
      return this;
    },

    async unlinkProvider(this: IUserDocument, provider: TAuthProvider) {
      if (this.isDeleted) throw new Error("Cannot unlink provider from deleted user");

      const removed = this.auth.providers.find((p) => p.provider === provider);
      this.auth.providers = this.auth.providers.filter((p) => p.provider !== provider);

      if (this.auth.providers.length === 0) {
        throw new Error("Cannot unlink last auth provider");
      }

      // if removed primary -> assign new primary
      if (removed?.isPrimary) {
        this.auth.providers.forEach((p) => (p.isPrimary = false));
        this.auth.providers[0].isPrimary = true;
      }

      // if local removed -> remove password
      if (provider === "LOCAL") {
        this.auth.passwordHash = undefined;
        this.auth.passwordUpdatedAt = undefined;
      }

      await this.save();
      return this;
    },

    async setPassword(this: IUserDocument, passwordHash: string) {
      if (this.isDeleted) throw new Error("Cannot set password for deleted user");

      const hasLocal = this.auth.providers.some((p) => p.provider === "LOCAL");

      if (!hasLocal) {
        this.auth.providers.push({
          provider: "LOCAL",
          isPrimary: false,
          linkedAt: new Date(),
        } as any);
      }

      this.auth.passwordHash = passwordHash;
      this.auth.passwordUpdatedAt = new Date();
      await this.save();
      return this;
    },

    async removePassword(this: IUserDocument) {
      if (this.isDeleted) throw new Error("Cannot remove password for deleted user");

      this.auth.passwordHash = undefined;
      this.auth.passwordUpdatedAt = undefined;

      // remove LOCAL provider
      this.auth.providers = this.auth.providers.filter((p) => p.provider !== "LOCAL");

      if (this.auth.providers.length === 0) {
        throw new Error("Cannot remove password: would remove last auth provider");
      }

      // ensure primary exists
      if (!this.auth.providers.some((p) => p.isPrimary)) {
        this.auth.providers.forEach((p) => (p.isPrimary = false));
        this.auth.providers[0].isPrimary = true;
      }

      await this.save();
      return this;
    },

    async recordLogin(this: IUserDocument, provider: TAuthProvider) {
      const now = new Date();

      this.auth.lastLoginAt = now;
      this.auth.failedLoginCount = 0;
      this.auth.lockedUntil = undefined;

      const p = this.auth.providers.find((x) => x.provider === provider);
      if (p) p.lastUsedAt = now;

      await this.save();
      return this;
    },

    async recordFailedLogin(this: IUserDocument) {
      this.auth.failedLoginCount += 1;

      // lock rule example (customize)
      if (this.auth.failedLoginCount >= 7) {
        this.auth.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }

      await this.save();
      return this;
    },

    hasOrgAccess(this: IUserDocument, orgId: string | mongoose.Types.ObjectId) {
      if (this.globalScope) return true;
      const needle = String(orgId);
      return (this.orgScopes || []).some((x) => String(x) === needle);
    },

    hasBranchAccess(this: IUserDocument, branchId: string | mongoose.Types.ObjectId) {
      if (this.globalScope) return true;
      if (!this.branchScopes || this.branchScopes.length === 0) return true;
      const needle = String(branchId);
      return this.branchScopes.some((x) => String(x) === needle);
    },
  },

  // ---------------- Static Methods ----------------
  statics: {
    async findActiveByEmail(this: IUserModel, email: string) {
      return this.findOne({
        email: email.toLowerCase().trim(),
        isDeleted: false,
      });
    },

    async findActiveByUserId(this: IUserModel, userId: string) {
      return this.findOne({
        userId,
        isDeleted: false,
      });
    },

    async findByProvider(this: IUserModel, provider: TAuthProvider, providerUserId: string) {
      return this.findOne({
        isDeleted: false,
        "auth.providers.provider": provider,
        "auth.providers.providerUserId": providerUserId,
      });
    },

    async findOrgUsers(this: IUserModel, orgId: mongoose.Types.ObjectId) {
      return this.find({ orgId, isDeleted: false }).sort({ createdAt: -1 });
    },
  },

  // ---------------- Virtuals ----------------
  virtuals: {
    statusLabel: function (this: IUserDocument) {
      if (this.isDeleted) return "Deleted";
      if (this.status === "SUSPENDED") return "Suspended";
      if (this.status === "INVITED") return "Invited";
      return "Active";
    },

    isLocked: function (this: IUserDocument) {
      if (!this.auth?.lockedUntil) return false;
      return new Date(this.auth.lockedUntil).getTime() > Date.now();
    },

    primaryProvider: function (this: IUserDocument) {
      const p = this.auth?.providers?.find((x) => x.isPrimary);
      return (p?.provider ?? null) as any;
    },
  },
};