import { Request, Response } from "express";
import { AppError } from "../../lib/types/index.js";
import { User } from "../../models/index.js";
import { helperUtils } from "../../lib/utils/index.js";
import { Role, TTechentiaRole } from "../../lib/consts/index.js";

type CreateTechentiaUserRequest = {
    email: string;
    name: string;
    roles: TTechentiaRole[];
};

export const platformUsersController = {
    async createTechentiaUser(req: Request, res: Response) {
        const data = req.body as CreateTechentiaUserRequest;

        if (!data.roles?.length) throw new AppError("roles are required", 400);
        if (data.roles.includes(Role.TECHENTIA_SUPER_ADMIN)) throw new AppError("Cannot create super admin", 403);

        const email = data.email.toLowerCase().trim();
        const existing = await User.findOne({ email, isDeleted: false });
        if (existing) throw new AppError("User already exists", 409);

        const user = await User.create({
            orgId: req.body.orgId ?? req.body.orgId, // still mandatory in schema; set to Techentia orgId in your system bootstrap
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
            globalScope: true,
            orgScopes: [],
            branchScopes: [],

            permissionOverrides: { allow: [], deny: [] },

            status: "INVITED",
            isDeleted: false,
        });

        return res.status(201).json({
            success: true,
            message: "Techentia user created successfully",
            data: { user },
        });
    },
};
