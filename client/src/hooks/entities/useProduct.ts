"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData, } from "@tanstack/react-query";
import { useState, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import { ProductType, CreateProductPayload, UpdateProductPayload, PaginationResponse, ProductStatus, } from "@/lib/types";
import { productsApi } from "@/lib/api";

export const useProduct = (queryParams?: string) => {
    const queryClient = useQueryClient();

    const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(null);
    const [pagination, setPagination] = useState<PaginationResponse | null>(null);

    /* -------------------- GET ALL PRODUCTS -------------------- */
    const { data: products = [], isLoading: isLoadingProducts, error: productsError, refetch: refetchProducts, } = useQuery({
        queryKey: ["admin", "products", queryParams],
        queryFn: async () => {
            const res = await productsApi.getAll(queryParams);

            if (res.data) {
                setPagination(res.data.pagination);
                return res.data.products;
            }

            return [];
        },
        placeholderData: keepPreviousData,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });

    /* -------------------- GET PRODUCT BY ID -------------------- */
    const getProductById = useCallback(async (id: string) => {
        const res = await productsApi.getById(id);
        const product = res.data;

        if (product) {
            setSelectedProduct(product);
        }

        return product;
    }, []);

    /* -------------------- CREATE PRODUCT -------------------- */
    const createProductMutation = useMutation({
        mutationFn: (payload: CreateProductPayload) =>
            productsApi.create(payload),

        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ["admin", "products"] });

            if (res.data) {
                setSelectedProduct(res.data);
            }

            res?.success
                ? toast.success(res.message)
                : toast.error(res.message ?? "Failed to create product");
        },

        onError: () => toast.error("Failed to create product"),
    });

    /* -------------------- UPDATE PRODUCT -------------------- */
    const updateProductMutation = useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: string;
            data: UpdateProductPayload;
        }) => productsApi.update(id, data),

        onSuccess: (res, { id }) => {
            queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
            queryClient.invalidateQueries({
                queryKey: ["admin", "products", id],
            });

            if (res.data && selectedProduct?._id === id) {
                setSelectedProduct(res.data);
            }

            res.success
                ? toast.success(res.message)
                : toast.error(res.message ?? "Failed to update product");
        },

        onError: () => toast.error("Failed to update product"),
    });

    /* -------------------- DELETE PRODUCT -------------------- */
    const deleteProductMutation = useMutation({
        mutationFn: (id: string) => productsApi.delete(id),

        onSuccess: (res, id) => {
            queryClient.invalidateQueries({ queryKey: ["admin", "products"] });

            if (selectedProduct?._id === id) {
                setSelectedProduct(null);
            }

            if (res.data?.success) {
                toast.success(res.data.message || "Product deleted successfully");
            }
        },

        onError: () => toast.error("Failed to delete product"),
    });

    /* -------------------- HELPERS -------------------- */
    const createProduct = useCallback(
        (data: CreateProductPayload) =>
            createProductMutation.mutateAsync(data).then((r) => r.data),
        [createProductMutation]
    );

    const updateProduct = useCallback(
        (id: string, data: UpdateProductPayload) =>
            updateProductMutation
                .mutateAsync({ id, data })
                .then((r) => r.data),
        [updateProductMutation]
    );

    const deleteProduct = useCallback(
        (id: string) => deleteProductMutation.mutateAsync(id),
        [deleteProductMutation]
    );

    const clearSelectedProduct = useCallback(
        () => setSelectedProduct(null),
        []
    );

    /* -------------------- FILTER HELPERS -------------------- */
    const getActiveProducts = useCallback(
        () => products.filter((p) => p.isActive && !p.isDeleted),
        [products]
    );

    const getDeletedProducts = useCallback(
        () => products.filter((p) => p.isDeleted),
        [products]
    );

    const getProductsByStatus = useCallback(
        (status: ProductStatus) =>
            products.filter((p) => p.status === status && !p.isDeleted),
        [products]
    );

    const isMutating =
        createProductMutation.isPending ||
        updateProductMutation.isPending ||
        deleteProductMutation.isPending;

    /* -------------------- RETURN -------------------- */
    return {
        // Data
        products,
        pagination,
        selectedProduct,

        // Loading & error
        isLoadingProducts,
        productsError,
        isMutating,

        // CRUD
        getProductById,
        createProduct,
        updateProduct,
        deleteProduct,

        // Mutations (optional exposure)
        mutations: {
            create: createProductMutation,
            update: updateProductMutation,
            delete: deleteProductMutation,
        },

        // Helpers
        getActiveProducts,
        getDeletedProducts,
        getProductsByStatus,

        // State
        setSelectedProduct,
        clearSelectedProduct,

        // Stats
        totalProducts: products.length,
        activeProductsCount: getActiveProducts().length,
        deletedProductsCount: getDeletedProducts().length,
    };
};
