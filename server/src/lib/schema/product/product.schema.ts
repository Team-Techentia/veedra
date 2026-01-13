import { z } from "zod";

export const productSchema = {
  create: z.object({
    name: z.string().min(2),

    categoryId: z.string().min(1),
    subCategoryId: z.string().optional(),

    size: z.string().optional(),
    color: z.string().optional(),
    brand: z.string().optional(),
    gender: z.enum(["MENS", "LADIES"]).optional(),

    hsnCode: z.string().optional(),

    pricing: z.object({
      factoryPrice: z.number().min(0),
      gstPercent: z.number().min(0).max(100).default(0),

      // optional override (admin override)
      allowOverride: z.boolean().optional(),
      mrp: z.number().min(0).optional(),
      offerPrice: z.number().min(0).optional(),
    }),

    images: z.array(z.object({ url: z.string().url(), publicId: z.string().optional() })).default([]),

    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  }),

  list: z.object({
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
    categoryId: z.string().optional(),
    subCategoryId: z.string().optional(),
  }).optional(),

  barcodeParam: z.object({
    barcode: z.string().min(3),
  }),
};
