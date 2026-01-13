import { Router } from "express";
import { productRouter } from "../product/product.route.js";
import { platformAuthRouter } from "../platform/platform.auth.route.js";
import { tenantAuthRouter } from "../tenant/tenant.auth.route.js";
import { platformUsersRouter } from "../platform/plattform.user.route.js";
import { tenantUsersRouter } from "../tenant/tenant.user.route.js";
import { externalAuthRouter } from "../external/external.auth.route.js";
import { categoryRouter } from "../category/category.routes.js";
import { subCategoryRouter } from "../category/subcategory.routes.js";

export const apiRouter = Router();

const API_PREFIX = "/api";

apiRouter.use(`${API_PREFIX}/product`, productRouter);
// AUTH
apiRouter.use(`${API_PREFIX}/platform/auth`, platformAuthRouter);
apiRouter.use(`${API_PREFIX}/tenant/auth`, tenantAuthRouter);
apiRouter.use(`${API_PREFIX}/external/auth`, externalAuthRouter);

// USER MANAGEMENT
apiRouter.use(`${API_PREFIX}/platform/users`, platformUsersRouter);
apiRouter.use(`${API_PREFIX}/tenant`, tenantUsersRouter);

apiRouter.use(`${API_PREFIX}/product`, productRouter);
apiRouter.use(`${API_PREFIX}/categories`, categoryRouter);
apiRouter.use(`${API_PREFIX}/subcategories`, subCategoryRouter);