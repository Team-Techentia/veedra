import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import { ZodSchema } from "zod";

type ValidationSchemas = {
  body?: ZodSchema<any>;
  query?: ZodSchema<any>;
};

export function withValidation(schemas: ValidationSchemas, handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        throw result.error; // ✅ preserve Zod issues
      }
      req.body = result.data;
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        throw result.error; // ✅ preserve Zod issues
      }
      req.query = result.data;
    }

    return handler(req, res);
  };
}
