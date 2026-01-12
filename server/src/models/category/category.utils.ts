import mongoose from "mongoose";
import { ICategoryDocument, ICategoryModel } from "../../lib/types/category/category.types.js";

export const categoryModelUtils = {
  // ---------------- Instance Methods ----------------
  methods: {
    async activate(this: ICategoryDocument) {
      if (this.isDeleted) throw new Error("Deleted category cannot be activated");
      this.isActive = true;
      await this.save();
      return this;
    },

    async deactivate(this: ICategoryDocument) {
      this.isActive = false;
      await this.save();
      return this;
    },

    async softDelete(this: ICategoryDocument) {
      // NOTE: actual business rule "cannot delete if products exist"
      // should be enforced in service layer using productCount OR aggregation
      if (this.productCount > 0) {
        throw new Error("Cannot delete category with active products");
      }
      this.isDeleted = true;
      this.deletedAt = new Date();
      this.isActive = false;
      await this.save();
      return this;
    },

    async createNewVersion(
      this: ICategoryDocument,
      input: Partial<Pick<ICategoryDocument, "name" | "slug" | "fullSlug" | "path" | "order" | "isLeaf">>
    ) {
      // Rule:
      // Meaning never mutates -> create new row version, expire old one

      // expire current version
      this.effectiveTo = new Date();
      this.isActive = false;
      await this.save();

      // create next version
      const Category = (this.constructor as any) as ICategoryModel;

      const nextVersion = await Category.create({
        orgId: this.orgId,

        categoryId: this.categoryId, // same stable business id
        name: input.name ?? this.name,
        slug: input.slug ?? this.slug,
        fullSlug: input.fullSlug ?? this.fullSlug,

        parent: this.parent,
        ancestors: this.ancestors,
        path: input.path ?? this.path,
        level: this.level,
        order: input.order ?? this.order,

        type: this.type,
        isLeaf: input.isLeaf ?? this.isLeaf,
        productCount: this.productCount,

        version: (this.version || 1) + 1,
        effectiveFrom: new Date(),
        effectiveTo: undefined,

        isActive: true,
        isDeleted: false,
      });

      return nextVersion;
    },
  },

  // ---------------- Static Methods ----------------
  statics: {
    async findActiveOne(this: ICategoryModel, orgId: mongoose.Types.ObjectId, categoryId: string) {
      return this.findOne({
        orgId,
        categoryId,
        isDeleted: false,
        isActive: true,
      });
    },

    async findBySlug(this: ICategoryModel, orgId: mongoose.Types.ObjectId, slug: string) {
      return this.findOne({
        orgId,
        slug: slug.toLowerCase().trim(),
        isDeleted: false,
      }).sort({ version: -1 });
    },

    async findOrgCategories(this: ICategoryModel, orgId: mongoose.Types.ObjectId) {
      return this.find({ orgId, isDeleted: false }).sort({ level: 1, order: 1, createdAt: -1 });
    },

    async findActiveOrgCategories(this: ICategoryModel, orgId: mongoose.Types.ObjectId) {
      return this.find({ orgId, isDeleted: false, isActive: true }).sort({ level: 1, order: 1 });
    },

    async findChildren(this: ICategoryModel, orgId: mongoose.Types.ObjectId, parentCategoryId: string) {
      return this.find({
        orgId,
        parent: parentCategoryId,
        isDeleted: false,
      }).sort({ order: 1, createdAt: -1 });
    },
  },

  // ---------------- Virtuals ----------------
  virtuals: {
    statusLabel: function (this: ICategoryDocument) {
      if (this.isDeleted) return "Deleted";
      if (!this.isActive) return "Inactive";
      return "Active";
    },
  },
};