import mongoose from "mongoose";
import { Response } from "express";
import { AuthRequest, AppError } from "../../lib/types/index.js";
import { Category, Product } from "../../models/index.js";
import { SubCategory } from "../../models/category/category.model.js";
import { generateBarcode, generateProductId, generateSku } from "../../lib/utils/index.js";

const round = (n: number) => Math.round(n);

// Pricing rules (from screenshot)
const calcPrices = (factoryPrice: number) => {
  return {
    mrp: round(factoryPrice * 2),
    offerPrice: round(factoryPrice / 0.6),
  };
};

const toObjectId = (id: string) => new mongoose.Types.ObjectId(id);

export const productController = {
  // ✅ Create Product (with auto pricing + barcode unique)
  async create(req: AuthRequest, res: Response) {
    const user = req.user;
    if (!user) throw new AppError("Authentication required", 401);

    const orgId = toObjectId(user.orgId);

    const body = req.body as any;

    // ---------------- Validate Category ----------------
    const category = await Category.findOne({
      orgId,
      _id: body.categoryId,
      isDeleted: false,
      status: "ACTIVE",
    });

    if (!category) throw new AppError("Category not found", 404);

    // ---------------- Validate SubCategory (optional) ----------------
    let subCategory: any = null;

    if (body.subCategoryId) {
      subCategory = await SubCategory.findOne({
        orgId,
        _id: body.subCategoryId,
        categoryId: category._id, // belongs to same category
        isDeleted: false,
        status: "ACTIVE",
      });

      if (!subCategory) throw new AppError("SubCategory not found for this Category", 404);
    }

    // ---------------- IDs ----------------
    const productId = generateProductId();
    const sku = generateSku(category.code, body.name);

    // ---------------- Barcode uniqueness retry ----------------
    let barcode = generateBarcode();

    for (let i = 0; i < 7; i++) {
      const exists = await Product.findOne({ orgId, barcode, isDeleted: false });
      if (!exists) break;
      barcode = generateBarcode();
    }

    // ---------------- Pricing Rules ----------------
    const factoryPrice: number = body.pricing.factoryPrice;
    const gstPercent: number = body.pricing.gstPercent ?? 0;

    const allowOverride: boolean = body.pricing.allowOverride ?? true;
    const auto = calcPrices(factoryPrice);

    const mrp =
      allowOverride && typeof body.pricing.mrp === "number"
        ? round(body.pricing.mrp)
        : auto.mrp;

    const offerPrice =
      allowOverride && typeof body.pricing.offerPrice === "number"
        ? round(body.pricing.offerPrice)
        : auto.offerPrice;

    // ---------------- Save ----------------
    const doc = await Product.create({
      orgId,

      productId,
      name: body.name,

      categoryId: category._id,
      subCategoryId: subCategory?._id,

      size: body.size,
      color: body.color,
      brand: body.brand,
      gender: body.gender,

      hsnCode: body.hsnCode,

      barcode,
      sku,

      images: body.images ?? [],

      pricing: {
        factoryPrice,
        gstPercent,
        mrp,
        offerPrice,
        allowOverride,
        lastCalculatedAt: new Date(),
      },

      status: body.status ?? "ACTIVE",

      createdBy: user._id,
      isDeleted: false,
    });

    const populated = await Product.findById(doc._id)
      .populate("categoryId", "name code")
      .populate("subCategoryId", "name code");

    return res.status(201).json({
      success: true,
      message: "Product created",
      data: populated,
    });
  },

  // ✅ List products (simple filters)
  async list(req: AuthRequest, res: Response) {
    const user = req.user;
    if (!user) throw new AppError("Authentication required", 401);

    const orgId = toObjectId(user.orgId);
    const { status, categoryId, subCategoryId } = req.query as any;

    const filter: any = { orgId, isDeleted: false };

    if (status) filter.status = status;
    if (categoryId) filter.categoryId = categoryId;
    if (subCategoryId) filter.subCategoryId = subCategoryId;

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .populate("categoryId", "name code")
      .populate("subCategoryId", "name code");

    return res.json({ success: true, data: products });
  },

  // ✅ Get by barcode
  async getByBarcode(req: AuthRequest, res: Response) {
    const user = req.user;
    if (!user) throw new AppError("Authentication required", 401);

    const orgId = toObjectId(user.orgId);
    const { barcode } = req.params as any;

    const product = await Product.findOne({ orgId, barcode, isDeleted: false })
      .populate("categoryId", "name code")
      .populate("subCategoryId", "name code");

    if (!product) throw new AppError("Product not found", 404);

    return res.json({ success: true, data: product });
  },

  // ✅ Soft delete product
  async softDelete(req: AuthRequest, res: Response) {
    const user = req.user;
    if (!user) throw new AppError("Authentication required", 401);

    const orgId = toObjectId(user.orgId);
    const { barcode } = req.params as any;

    const product = await Product.findOne({ orgId, barcode, isDeleted: false });

    if (!product) throw new AppError("Product not found", 404);

    await product.softDelete();

    return res.json({ success: true, message: "Product deleted", data: product });
  },

  // ✅ Force recalculation of pricing (factoryPrice changed)
  async recalcPricing(req: AuthRequest, res: Response) {
    const user = req.user;
    if (!user) throw new AppError("Authentication required", 401);

    const orgId = toObjectId(user.orgId);
    const { barcode } = req.params as any;

    const product = await Product.findOne({ orgId, barcode, isDeleted: false });
    if (!product) throw new AppError("Product not found", 404);

    await product.recalcPricing();

    const populated = await Product.findById(product._id)
      .populate("categoryId", "name code")
      .populate("subCategoryId", "name code");

    return res.json({ success: true, message: "Pricing recalculated", data: populated });
  },
};
