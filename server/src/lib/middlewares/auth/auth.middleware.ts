import { Response, NextFunction, RequestHandler } from "express";
import { AppError, AuthRequest } from "../../types/index.js";
import { jwtUtils } from "../../utils/token/token.utils.js";
import { AccessTokenPayload } from "../../types/auth/auth.types.js";

export const authenticate: RequestHandler = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const payload = jwtUtils.verifyRequestToken(req, "ACCESS") as AccessTokenPayload;

    if (!payload) throw new AppError("Authentication required", 401);

    // ✅ Build AuthUser explicitly
    req.user = {
      ...payload,
      _id: payload.sub, // canonical mapping
    };

    next();
  } catch (err) {
    next(err);
  }
};