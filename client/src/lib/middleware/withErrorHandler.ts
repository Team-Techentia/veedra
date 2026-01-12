import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import { ApiResponse } from "../types";
import { errorHandler } from "../utils";

export function withErrorHandler(handler: NextApiHandler) {
    return async (req: NextApiRequest, res: NextApiResponse<ApiResponse>) => {
        try {
            return await handler(req, res);
        } catch (err: any) {
            console.error("API Error:", err);
            const { status, body } = errorHandler(err);
            res.status(status).json(body);
        };
    }
}