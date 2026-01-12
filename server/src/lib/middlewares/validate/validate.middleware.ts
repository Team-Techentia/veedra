import { Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { AuthRequest } from "../../types/index.js";

type ValidationSchemas = {
    body?: ZodSchema<any>;
    params?: ZodSchema<any>;
    query?: ZodSchema<any>;
};

export const validate = (schemas: ValidationSchemas) =>
    (req: AuthRequest, res: Response, next: NextFunction) => {
        if (schemas.body) {
            const result = schemas.body.safeParse(req.body);
            if (!result.success) return next(result.error);
            req.body = result.data;
        }

        if (schemas.params) {
            const result = schemas.params.safeParse(req.params);
            if (!result.success) return next(result.error);
            req.params = result.data as any;
        }

        if (schemas.query) {
            const result = schemas.query.safeParse(req.query);
            if (!result.success) return next(result.error);
            req.query = result.data as any;
        }

        next();
    };