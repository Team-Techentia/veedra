import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import { jwtServerUtils } from "../utils";
import { AppError } from "../types";

export function withAuth(handler: NextApiHandler, requireAdmin = false) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const user = jwtServerUtils.cookie.getUser(req);
    // console.log(user)

    if (!user) {
      throw new AppError("Unauthorized", 401);
    }

    if (requireAdmin && !user.isAdmin) {
      throw new AppError("Forbidden: Admin only access", 403);
    }

    // attach user to req for downstream handlers
    (req as any).user = user;

    return handler(req, res);
  };
}
