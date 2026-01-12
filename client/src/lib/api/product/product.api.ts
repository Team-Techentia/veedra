import { CreateProductPayload, PaginationResponse, UpdateProductPayload } from "@/lib/types";
import axiosClient from "../client/axios";
import { ProductType, } from "@/lib/types/product/product.types";

export const productsApi = {
    getAll: (queryParams?: string) => axiosClient.get<{ products: ProductType[], pagination: PaginationResponse }>(`/api/product${queryParams ? `?${queryParams}` : ""}`),
    getById: (id: string) => axiosClient.get<ProductType>(`/api/product/${id}`),
    create: (payload: CreateProductPayload) => axiosClient.post<ProductType>(`/api/product`, payload),
    update: (id: string, payload: UpdateProductPayload) => axiosClient.patch<ProductType>(`/api/product/${id}`, payload),
    delete: (id: string) => axiosClient.delete<{ success: boolean; message: string }>(`/api/product/${id}`),
}