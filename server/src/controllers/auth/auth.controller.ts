import { Request, Response } from "express";
import { AppError, AuthRequest } from "../../lib/types/index.js";
import { jwtUtils } from "../../lib/utils/token/token.utils.js";
import { User } from "../../models/index.js";
import { helperUtils } from "../../lib/utils/index.js";
import { EXTERNAL_ROLES, INTERNAL_ROLES, TECHENTIA_ROLES, TSystemRole } from "../../lib/consts/index.js";

type LoginRequest = {
    email: string;
    password: string;
    orgId?: string;
    branchId?: string;
};

function assertRoleInAllowed(userRoles: readonly TSystemRole[], allowed: readonly TSystemRole[]) {
    const ok = allowed.some((r) => userRoles.includes(r));
    if (!ok) throw new AppError("Forbidden: account not allowed in this portal", 403);
}

export const authController = {
    // ---------------- LOGIN (LOCAL) ----------------
    async login(req: Request, res: Response) {
        const data = req.body as LoginRequest;

        const email = data.email.toLowerCase().trim();
        const user = await User.findOne({ email, isDeleted: false });

        if (!user) throw new AppError("Invalid credentials", 401);
        if (user.status !== "ACTIVE") throw new AppError("User is not active", 403);

        // ensure local exists
        const hasLocal = user.auth.providers.some((p) => p.provider === "LOCAL");
        if (!hasLocal || !user.auth.passwordHash) throw new AppError("Password login not enabled", 403);

        // verify password (use your helper)
        const ok = await helperUtils.password.compare(data.password, user.auth.passwordHash);
        if (!ok) {
            await user.recordFailedLogin();
            throw new AppError("Invalid credentials", 401);
        }

        if (user.isLocked) throw new AppError("Account locked. Try later.", 403);

        // ✅ org context rules
        // platform users: orgId not needed
        // tenant users: orgId required (current org context)
        const orgId = data.orgId ?? String(user.orgId);
        const branchId = data.branchId;

        // session id (can be from DB session manager later)
        const sessionId = helperUtils.id.nanoid();

        // issue tokens
        const accessToken = jwtUtils.generateToken(
            {
                sub: String(user._id),
                userId: user.userId,
                orgId,
                branchId,
                roles: user.roles,
                globalScope: user.globalScope,
                allow: user.permissionOverrides.allow,
                deny: user.permissionOverrides.deny,
                sessionId,
            },
            "ACCESS"
        );

        const refreshToken = jwtUtils.generateToken(
            { sub: String(user._id), sessionId },
            "REFRESH"
        );

        jwtUtils.setAuthCookies(res, { accessToken, refreshToken });

        await user.recordLogin("LOCAL");

        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                user: {
                    _id: user._id,
                    userId: user.userId,
                    email: user.email,
                    name: user.name,
                    roles: user.roles,
                    globalScope: user.globalScope,
                    orgId,
                    branchId,
                },
            },
        });
    },

    // ---------------- REFRESH ----------------
    async refresh(req: Request, res: Response) {
        const refresh = jwtUtils.verifyRequestToken(req, "REFRESH");

        // optional: validate session in DB (recommended)
        // await sessionManager.assertValid(refresh.sessionId);

        const user = await User.findById(refresh.sub);
        if (!user || user.isDeleted) throw new AppError("Invalid session", 401);

        // keep latest roles and overrides
        const accessToken = jwtUtils.generateToken(
            {
                sub: String(user._id),
                userId: user.userId,
                orgId: String(user.orgId),
                branchId: undefined,
                roles: user.roles,
                globalScope: user.globalScope,
                allow: user.permissionOverrides.allow,
                deny: user.permissionOverrides.deny,
                sessionId: refresh.sessionId,
            },
            "ACCESS"
        );

        jwtUtils.setAccessCookie(res, accessToken);

        return res.status(200).json({ success: true, message: "Access token refreshed" });
    },

    // ---------------- LOGOUT ----------------
    async logout(_req: Request, res: Response) {
        // optional: revoke sessionId in db
        jwtUtils.clearAuthCookies(res);
        return res.status(200).json({ success: true, message: "Logged out successfully" });
    },

    // ---------------- ME ----------------
    async me(req: AuthRequest, res: Response) {
        if (!req.user) throw new AppError("Authentication required", 401);

        return res.status(200).json({
            success: true,
            message: "User fetched successfully",
            data: { user: req.user },
        });
    },

    // ---------------- PORTAL GUARDS ----------------
    async guardPlatform(req: AuthRequest, res: Response) {
        if (!req.user) throw new AppError("Authentication required", 401);
        assertRoleInAllowed(req.user.roles, TECHENTIA_ROLES);
        return res.status(200).json({ success: true, message: "Platform user verified" });
    },

    async guardTenant(req: AuthRequest, res: Response) {
        if (!req.user) throw new AppError("Authentication required", 401);
        assertRoleInAllowed(req.user.roles, INTERNAL_ROLES);
        return res.status(200).json({ success: true, message: "Tenant user verified" });
    },

    async guardExternal(req: AuthRequest, res: Response) {
        if (!req.user) throw new AppError("Authentication required", 401);
        assertRoleInAllowed(req.user.roles, EXTERNAL_ROLES);
        return res.status(200).json({ success: true, message: "External user verified" });
    },
};
