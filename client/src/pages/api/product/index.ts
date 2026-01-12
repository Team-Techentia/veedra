import type { NextApiRequest, NextApiResponse } from "next";
// import { dbConnect } from "@/lib/config";
import { productServerUtils } from "@/lib/utils/server";
import { withValidation, withErrorHandler, withAuth } from "@/lib/middleware";
import { productSchema } from "@/lib/schema";
import { AppError } from "@/lib/types";

async function handler(req: NextApiRequest, res: NextApiResponse) {
    // await dbConnect();

    switch (req.method) {
        case "POST": {
            const result = await productServerUtils.createProduct(req);
            return res.status(201).json(result);
        }

        case "GET": {
            const result = await productServerUtils.getActiveProducts(req);
            return res.status(200).json(result);
        }

        default:
            throw new AppError("Method not allowed", 405);
    }
}

export default withErrorHandler(
    withAuth(async (req: NextApiRequest, res: NextApiResponse) => {
        if (req.method === "POST") {
            return withValidation({ body: productSchema.createProductSchema },handler)(req, res);
        }

        return handler(req, res);
    })
);