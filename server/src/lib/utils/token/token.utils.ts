import jwt, { SignOptions } from "jsonwebtoken";
import { Request, Response } from "express";
import { AppError } from "../../types/index.js";
import { TSessionType } from "../../types/auth/auth.types.js";
import type {
  AccessTokenPayload,
  RefreshTokenPayload,
} from "../../types/auth/auth.types.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key";

const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "30d";

const ACCESS_COOKIE = process.env.NEXT_PUBLIC_ACCESS_COOKIE_NAME || "auth_access";
const REFRESH_COOKIE = process.env.NEXT_PUBLIC_REFRESH_COOKIE_NAME || "auth_refresh";

export function generateToken(payload: Record<string, any>, type: TSessionType): string {
  const expiresIn = type === "ACCESS" ? ACCESS_EXPIRES_IN : REFRESH_EXPIRES_IN;
  return jwt.sign({ ...payload, typ: type }, JWT_SECRET, { expiresIn } as SignOptions);
}

export function verifyToken<T = any>(token: string): T {
  try {
    return jwt.verify(token, JWT_SECRET) as T;
  } catch (error: any) {
    if (error.name === "TokenExpiredError") throw new AppError("Token expired", 401);
    if (error.name === "JsonWebTokenError") throw new AppError("Invalid token", 401);
    throw new AppError("Token verification failed", 401);
  }
}

export function setAuthCookies(res: Response, input: { accessToken: string; refreshToken: string }) {
  const isProduction = process.env.NODE_ENV === "production";
  const common = `HttpOnly; Path=/; SameSite=Strict${isProduction ? "; Secure" : ""}`;

  res.setHeader("Set-Cookie", [
    `${ACCESS_COOKIE}=${input.accessToken}; ${common}; Max-Age=${15 * 60}`,
    `${REFRESH_COOKIE}=${input.refreshToken}; ${common}; Max-Age=${30 * 24 * 60 * 60}`,
  ]);
}

export function clearAuthCookies(res: Response) {
  const isProduction = process.env.NODE_ENV === "production";
  const common = `HttpOnly; Path=/; SameSite=Strict${isProduction ? "; Secure" : ""}`;

  res.setHeader("Set-Cookie", [
    `${ACCESS_COOKIE}=; ${common}; Max-Age=0`,
    `${REFRESH_COOKIE}=; ${common}; Max-Age=0`,
  ]);
}

export function getTokenFromRequest(req: Request, type: TSessionType): string | null {
  const cookieName = type === "ACCESS" ? ACCESS_COOKIE : REFRESH_COOKIE;

  // cookie first
  const cookieToken = (req as any).cookies?.[cookieName];
  if (cookieToken) return cookieToken;

  // header fallback ONLY for access token
  if (type === "ACCESS") {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) return authHeader.substring(7);
  }

  return null;
}

export function setAccessCookie(res: Response, accessToken: string) {
  const isProduction = process.env.NODE_ENV === "production";
  const common = `HttpOnly; Path=/; SameSite=Strict${isProduction ? "; Secure" : ""}`;

  res.setHeader("Set-Cookie", [
    `${ACCESS_COOKIE}=${accessToken}; ${common}; Max-Age=${15 * 60}`,
  ]);
}

/**
 * ✅ Overloads: easy usage & auto return type based on ACCESS/REFRESH
 */
export function verifyRequestToken(req: Request, type: "ACCESS"): AccessTokenPayload;
export function verifyRequestToken(req: Request, type: "REFRESH"): RefreshTokenPayload;
export function verifyRequestToken(req: Request, type: TSessionType) {
  const token = getTokenFromRequest(req, type);
  if (!token) throw new AppError("No token provided", 401);

  const payload = verifyToken<any>(token);

  if (!payload?.typ || payload.typ !== type) {
    throw new AppError(`Invalid token type. Expected ${type}`, 401);
  }

  return payload;
}

// Optional: keep your old object style
export const jwtUtils = {
  generateToken,
  verifyToken,
  setAuthCookies,
  clearAuthCookies,
  getTokenFromRequest,
  verifyRequestToken,
  setAccessCookie,
};
