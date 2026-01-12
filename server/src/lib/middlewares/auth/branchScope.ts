import { NextFunction, Response, RequestHandler } from "express";
import { AppError, AuthRequest } from "../../types/index.js";

export const requireOrgScope = (orgIdGetter?: (req: AuthRequest) => string): RequestHandler => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) return next(new AppError("Authentication required", 401));

    // globalScope bypasses tenant boundary check
    if (user.globalScope) return next();

    const orgId = orgIdGetter?.(req) || (req.params.orgId ?? req.body.orgId ?? req.query.orgId);
    if (!orgId) return next(new AppError("orgId missing", 400));

    // in your canonical user model orgScopes exist in DB,
    // but in token you only keep current org context.
    // So we check current orgId context matches.
    if (String(user.orgId) !== String(orgId)) {
      return next(new AppError("Forbidden: wrong org scope", 403));
    }

    next();
  };
};

export const requireBranchScope = (branchIdGetter?: (req: AuthRequest) => string): RequestHandler => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) return next(new AppError("Authentication required", 401));

    if (user.globalScope) return next();

    const branchId = branchIdGetter?.(req) || (req.params.branchId ?? req.body.branchId ?? req.query.branchId);
    if (!branchId) return next(new AppError("branchId missing", 400));

    // If you use "current branch context in token"
    if (user.branchId && String(user.branchId) !== String(branchId)) {
      return next(new AppError("Forbidden: wrong branch scope", 403));
    }

    next();
  };
};