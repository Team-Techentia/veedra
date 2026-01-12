import { Request, Response } from "express";
import { AppError } from "../../lib/types/index.js";
import { User } from "../../models/index.js";
import { helperUtils } from "../../lib/utils/index.js";
import { CreateTenantUserRequest } from "../../lib/schema/index.js";

export const tenantUsersController = {
  async createTenantUser(req: Request, res: Response) {
    const orgId = req.params.orgId;
    const data = req.body as CreateTenantUserRequest;

    const email = data.email.toLowerCase().trim();
    const existing = await User.findOne({ email, isDeleted: false });
    if (existing) throw new AppError("User already exists", 409);

    const user = new User({
      orgId: helperUtils.mongo.toObjectId(orgId),
      userId: helperUtils.id.nanoid(),

      email,
      name: data.name,

      auth: {
        providers: [{ provider: "OTP", isPrimary: true, linkedAt: new Date() }],
        mfaEnabled: false,
        mfaMethod: "NONE",
        failedLoginCount: 0,
      },

      roles: data.roles,
      globalScope: false,
      orgScopes: [helperUtils.mongo.toObjectId(orgId)],
      branchScopes: (data.branchScopes ?? []).map((id) => helperUtils.mongo.toObjectId(id)),

      permissionOverrides: { allow: [], deny: [] },

      status: "INVITED",
      isDeleted: false,
    });

    const createdUser = await user.save();

    return res.status(201).json({
      success: true,
      message: "Tenant user created successfully",
      data: { user: createdUser },
    });
  },
};