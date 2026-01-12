import { Request, Response } from "express";
import { Product } from "../../models/index.js";
import { AppError } from "../../lib/types/index.js";
import { CreateProductRequest, UpdateProductRequest, } from "../../lib/schema/index.js";
import { helperUtils } from "../../lib/utils/index.js";

export const productController = {
    // ---------------- CREATE ----------------
    async createProduct(req: Request, res: Response) {
        const data = req.body as CreateProductRequest;

        const existing = await Product.findOne({ productId: data.productId, isDeleted: false, });
        if (existing) { throw new AppError(`Product '${data.productId}' already exists`, 409); }

        const product = await Product.create(data);

        if (!product) { throw new AppError("Failed to create product", 500); }

        res.status(201).json({ success: true, message: "Product created successfully", data: { product }, });
    },

    // ---------------- LIST (ACTIVE) ----------------
    async getProduct(req: Request, res: Response) {
        const { filter, pagination, sort } =
            helperUtils.buildQuery(
                req.query,
                ["name", "price", "stock", "isActive", "createdAt", "branchId"], // allowed filters
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

        res.status(200).json({
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
        });
    },

    // ---------------- GET BY ID ----------------
    async getProductById(req: Request, res: Response) {
        const { id } = req.params;

        const product = await Product.findOne({ _id: id, isDeleted: false, });

        if (!product) { throw new AppError("Product not found", 404); }

        return res.status(200).json({ success: true, message: "Product fetched successfully", data: { product }, });
    },

    // ---------------- UPDATE ----------------
    async updateProduct(req: Request, res: Response) {
        const { id } = req.params;
        const data = req.body as UpdateProductRequest;

        const product = await Product.findOne({ productId: id, isDeleted: false, });

        if (!product) { throw new AppError("Product not found or deleted", 404); }

        // mutate allowed fields only
        Object.assign(product, data);

        const updatedProduct = await product.save();

        return res.status(200).json({ success: true, message: "Product updated successfully", data: { product: updatedProduct }, });
    },

    // ---------------- DELETE (SOFT) ----------------
    async deleteProduct(req: Request, res: Response) {
        const { id } = req.params;

        const product = await Product.findOne({ productId: id, isDeleted: false, });

        if (!product) { throw new AppError("Product not found or already deleted", 404); }

        product.isDeleted = true;
        product.isActive = false;

        const deletedProduct = await product.save();

        return res.status(200).json({ success: true, message: "Product deleted successfully", data: { product: deletedProduct }, });
    }
};
