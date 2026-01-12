"use client";

// @/lib/config/entitySchema.ts
import { FilterSchema, EntityType } from "@/lib/types";
import { productEntitySchema } from "./product.schema";

export const entitySchema: Record<EntityType, FilterSchema> = {
  product: productEntitySchema,
};
