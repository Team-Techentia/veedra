import mongoose from "mongoose";
import { ICategoryDocument, ICategoryModel, ISubCategoryDocument, ISubCategoryModel } from "../../lib/types/category/category.types.js";

export const categoryModelUtils = {
  methods: {
    async softDelete(this: ICategoryDocument) {
      this.isDeleted = true;
      this.deletedAt = new Date();
      this.status = "INACTIVE";
      await this.save();
      return this;
    },
  },
  statics: {
    async findOrgCategories(this: ICategoryModel, orgId: mongoose.Types.ObjectId) {
      return this.find({ orgId, isDeleted: false }).sort({ createdAt: -1 });
    },
    async findByCode(this: ICategoryModel, orgId: mongoose.Types.ObjectId, code: string) {
      return this.findOne({ orgId, code: code.toUpperCase().trim(), isDeleted: false });
    },
  },
};

export const subCategoryModelUtils = {
  methods: {
    async softDelete(this: ISubCategoryDocument) {
      this.isDeleted = true;
      this.deletedAt = new Date();
      this.status = "INACTIVE";
      await this.save();
      return this;
    },
  },
  statics: {
    async findOrgSubCategories(this: ISubCategoryModel, orgId: mongoose.Types.ObjectId) {
      return this.find({ orgId, isDeleted: false }).sort({ createdAt: -1 });
    },

    async findCategorySubCategories(this: ISubCategoryModel, orgId: mongoose.Types.ObjectId, categoryId: mongoose.Types.ObjectId) {
      return this.find({ orgId, categoryId, isDeleted: false }).sort({ createdAt: -1 });
    },

    async findByCode(this: ISubCategoryModel, orgId: mongoose.Types.ObjectId, code: string) {
      return this.findOne({ orgId, code: code.toUpperCase().trim(), isDeleted: false });
    },
  },
};
