import type { NextApiRequest, NextApiResponse } from "next";
// import { dbConnect } from "@/lib/config";
import { productServerUtils } from "@/lib/utils/server";
import { withAuth, withErrorHandler, withValidation, } from "@/lib/middleware";
import { productSchema } from "@/lib/schema";
import { AppError } from "@/lib/types";

async function handler(req: NextApiRequest, res: NextApiResponse) {
    // await dbConnect();

    const { id } = req.query as { id: string };

    switch (req.method) {
        // ---------------- GET BY ID ----------------
        case "GET": {
            const result = await productServerUtils.getProductById(id);
            return res.status(200).json(result);
        }

        // ---------------- UPDATE ----------------
        case "PATCH": {
            const result = await productServerUtils.updateProduct(id, req.body);
            return res.status(200).json(result);
        }

        // ---------------- DELETE (SOFT) ----------------
        case "DELETE": {
            const result = await productServerUtils.deleteProduct(id);
            return res.status(200).json(result);
        }

        default:
            throw new AppError("Method not allowed", 405);
    }
}

export default withErrorHandler(
    withAuth(async (req: NextApiRequest, res: NextApiResponse) => {
        switch (req.method) {
            case "GET":
            case "DELETE":
                return withValidation({ query: productSchema.productIdSchema }, handler)(req, res);

            case "PATCH":
                return withValidation({ query: productSchema.productIdSchema, body: productSchema.updateProductSchema, }, handler)(req, res);

            default:
                return handler(req, res);
        }
    })
);
