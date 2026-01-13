import mongoose from "mongoose";
import { Response } from "express";
import { AuthRequest, AppError } from "../../lib/types/index.js";
import { Category } from "../../models/index.js";
import { SubCategory } from "../../models/category/category.model.js";

const genCategoryId = () => `CAT_${Date.now()}`;

export const categoryController = {
  async create(req: AuthRequest, res: Response) {
    const user = req.user;
    if (!user) throw new AppError("Authentication required", 401);

    const orgId = new mongoose.Types.ObjectId(user.orgId);
    const { name, code } = req.body as any;

    const doc = await Category.create({
      orgId,
      categoryId: genCategoryId(),
      name: name.trim(),
      code: code.toUpperCase().trim(),
      createdBy: user._id,
      isDeleted: false,
      status: "ACTIVE",
    });

    return res.status(201).json({ success: true, message: "Category created", data: doc });
  },

  async list(req: AuthRequest, res: Response) {
    const user = req.user;
    if (!user) throw new AppError("Authentication required", 401);

    const orgId = new mongoose.Types.ObjectId(user.orgId);
    const list = await Category.findOrgCategories(orgId);

    return res.json({ success: true, data: list });
  },
};

// import mongoose from "mongoose";
// import { Response } from "express";
// import { AuthRequest, AppError } from "../../lib/types/index.js";
// import { Category, SubCategory } from "../../models/index.js";

const genSubCategoryId = () => `SUBCAT_${Date.now()}`;

export const subCategoryController = {
  async create(req: AuthRequest, res: Response) {
    const user = req.user;
    if (!user) throw new AppError("Authentication required", 401);

    const orgId = new mongoose.Types.ObjectId(user.orgId);
    const { categoryId, name, code } = req.body as any;

    const cat = await Category.findOne({ orgId, _id: categoryId, isDeleted: false });
    if (!cat) throw new AppError("Category not found", 404);

    const doc = await SubCategory.create({
      orgId,
      categoryId,
      subCategoryId: genSubCategoryId(),
      name: name.trim(),
      code: code.toUpperCase().trim(),
      createdBy: user._id,
      isDeleted: false,
      status: "ACTIVE",
    });

    return res.status(201).json({ success: true, message: "SubCategory created", data: doc });
  },

  async listByCategory(req: AuthRequest, res: Response) {
    const user = req.user;
    if (!user) throw new AppError("Authentication required", 401);

    const orgId = new mongoose.Types.ObjectId(user.orgId);
    const { categoryId } = req.params as any;

    const list = await SubCategory.findCategorySubCategories(orgId, new mongoose.Types.ObjectId(categoryId));
    return res.json({ success: true, data: list });
  },
};
