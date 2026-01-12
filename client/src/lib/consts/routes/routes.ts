export const ROUTES = {
    HOME: "/",
    ABOUT: "/about",
    ADMIN: {
        ROOT: "/admin",
        PRODUCTS: "/admin/products",
        PRODUCT: (id: string) => `/admin/products/edit/${id}`,
    }
}