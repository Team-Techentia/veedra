import type { NextApiRequest } from "next";
import { Product } from "@/lib/config/db/models";
import { ApiResponse, AppError } from "@/lib/types";
import { CreateProductRequest, UpdateProductRequest, } from "@/lib/schema";
import { helperServerUtils } from "@/lib/utils/server";

export const productServerUtils = {
    // ---------------- CREATE ----------------
    async createProduct(req: NextApiRequest): Promise<ApiResponse<any>> {
        const data = req.body as CreateProductRequest;

        const existing = await Product.findOne({ productId: data.productId, isDeleted: false, });

        if (existing) { throw new AppError(`Product '${data.productId}' already exists`, 409); }

        const product = await Product.create(data);

        return { success: true, message: "Product created successfully", data: { product }, };
    },

    // ---------------- LIST (ACTIVE + PAGINATED) ----------------
    async getActiveProducts(req: NextApiRequest): Promise<ApiResponse<any>> {
        const { filter, pagination, sort } =
            helperServerUtils.buildQuery(
                req.query,
                ["name", "price", "stock", "isActive", "createdAt",], // allowed filters
                "createdAt", // default sort
                ["name"]     // searchable fields
            );

        // enforce visibility rules
        filter.isDeleted = false;
        filter.isActive = true;

        const [products, total] = await Promise.all([
            Product.find(filter)
                .sort(sort)
                .skip(pagination.skip)
                .limit(pagination.limit),

            Product.countDocuments(filter),
        ]);

        const totalPages = Math.ceil(total / pagination.limit);

        return {
            success: true,
            message: "Products retrieved successfully",
            data: {
                products,
                pagination: {
                    currentPage: pagination.page,
                    totalPages,
                    totalCount: total,
                    hasNextPage: pagination.page < totalPages,
                    hasPrevPage: pagination.page > 1,
                    limit: pagination.limit,
                },
            },
        };
    },

    // ---------------- GET BY ID ----------------
    async getProductById(productId: string): Promise<ApiResponse<any>> {
        const product = await Product.findOne({
            productId,
            isDeleted: false,
        });

        if (!product) {
            throw new AppError("Product not found", 404);
        }

        return {
            success: true,
            message: "Product fetched successfully",
            data: { product },
        };
    },

    // ---------------- UPDATE ----------------
    async updateProduct(
        productId: string,
        data: UpdateProductRequest
    ): Promise<ApiResponse<any>> {
        const product = await Product.findOne({
            productId,
            isDeleted: false,
        });

        if (!product) {
            throw new AppError("Product not found or deleted", 404);
        }

        // mutate → save (hooks + validation run)
        Object.assign(product, data);

        const updatedProduct = await product.save();

        return {
            success: true,
            message: "Product updated successfully",
            data: { product: updatedProduct },
        };
    },

    // ---------------- DELETE (SOFT) ----------------
    async deleteProduct(productId: string): Promise<ApiResponse<any>> {
        const product = await Product.findOne({
            productId,
            isDeleted: false,
        });

        if (!product) {
            throw new AppError("Product not found or already deleted", 404);
        }

        product.isDeleted = true;
        product.isActive = false;

        const deletedProduct = await product.save();

        return {
            success: true,
            message: "Product deleted successfully",
            data: { product: deletedProduct },
        };
    },
};
