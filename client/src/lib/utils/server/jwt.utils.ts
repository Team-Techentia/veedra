// @/lib/utils/server/jwt.server.utils.ts
import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { NextApiRequest, NextApiResponse } from "next";
import { AppError } from "@/lib/types";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const COOKIE_NAME = process.env.NEXT_PUBLIC_TOKEN_COOKIE_NAME || 'auth_token'

export const jwtServerUtils = {
    generateToken(payload: JwtPayload): string {
        return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as SignOptions);
    },

    verifyToken(token: string): JwtPayload {
        try {
            return jwt.verify(token, JWT_SECRET) as JwtPayload;
        } catch (error: any) {
            if (error.name === "TokenExpiredError") {
                throw new AppError("Token expired", 401);
            }
            if (error.name === "JsonWebTokenError") {
                throw new AppError("Invalid token", 401);
            }
            throw new AppError("Token verification failed", 401);
        }
    },

    setAuthCookie(res: NextApiResponse, token: string): void {
        const isProduction = process.env.NODE_ENV === "production";

        res.setHeader("Set-Cookie", [
            `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Strict${isProduction ? "; Secure" : ""
            }`,
        ]);
    },

    clearAuthCookie(res: NextApiResponse): void {
        res.setHeader("Set-Cookie", [
            `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict`,
        ]);
    },

    getTokenFromRequest(req: NextApiRequest): string | null {
        // Try cookie first
        const cookieToken = req.cookies[COOKIE_NAME];
        if (cookieToken) return cookieToken;

        // Try Authorization header
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }

        return null;
    },

    async verifyRequestToken(req: NextApiRequest): Promise<JwtPayload> {
        const token = this.getTokenFromRequest(req);
        if (!token) {
            throw new AppError("No token provided", 401);
        }

        return this.verifyToken(token);
    },

    // Cookie utilities
    cookie: {
        getUser(req: NextApiRequest): JwtPayload | null {
            try {
                const token = jwtServerUtils.getTokenFromRequest(req);
                if (!token) return null;
                return jwtServerUtils.verifyToken(token);
            } catch {
                return null;
            }
        }
    }
};