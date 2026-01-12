"use client";

import React, { useState } from "react";
import { Home, Package } from "lucide-react";
import { BreadcrumbItem, ProductType } from "@/lib/types";
import { DeleteProductModal } from "./_components";
import { useModal, useFilter, useProduct, usePagination, useTable, } from "@/hooks";
import { Breadcrumbs, FilterDropdown, FilterSheet, PageHeader, Pagination, SearchBar, Table, Button, } from "@/components";
import { entitySchema, ROUTES } from "@/lib/consts";
import { useRouter } from "next/navigation";

export default function AdminProductsPage() {
    /* -------------------- FILTERS -------------------- */
    const { filters, activeFilters, setFilter, resetFilters } =
        useFilter("product");

    const [isFilterOpen, setIsFilterOpen] = useState(false);

    /* -------------------- DATA -------------------- */
    const {
        products,
        pagination,
        isLoadingProducts,
        deleteProduct,
        isMutating,
        selectedProduct,
        setSelectedProduct,
    } = useProduct(activeFilters);

    /* -------------------- PAGINATION -------------------- */
    const { handlePageChange, handleItemsPerPageChange } =
        usePagination(setFilter);

    /* -------------------- TABLE -------------------- */
    const { visibleColumns, toggleSort, columnOptions, handleColumnChange } =
        useTable(entitySchema.product.tableColumns, filters, setFilter);

    /* -------------------- MODALS -------------------- */
    const deleteModal = useModal();
    const router = useRouter();

    /* -------------------- HANDLERS -------------------- */
    const handleDeleteProduct = async (id: string) => {
        await deleteProduct(id);
    };

    const handleEdit = (product: ProductType) => {
        router.push(ROUTES.ADMIN.PRODUCT(product._id));
    };

    const handleDelete = (product: ProductType) => {
        setSelectedProduct(product);
        deleteModal.openModal();
    };

    const handleView = (product: ProductType) => {
        setSelectedProduct(product);
        router.push(ROUTES.ADMIN.PRODUCT(product._id));
    };

    /* -------------------- BREADCRUMB -------------------- */
    const breadcrumbItems: BreadcrumbItem[] = [
        { label: "Dashboard", href: ROUTES.ADMIN.ROOT, icon: Home },
        { label: "Products", icon: Package },
    ];

    /* -------------------- LOADING -------------------- */
    if (isLoadingProducts) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
                    <p className="mt-4 text-gray-600">Loading products...</p>
                </div>
            </div>
        );
    }

    /* -------------------- RENDER -------------------- */
    return (
        <div className="min-h-screen bg-gray-50 py-4">
            {/* Delete Modal */}
            <DeleteProductModal
                isOpen={deleteModal.isOpen}
                closeModal={deleteModal.closeModal}
                product={selectedProduct}
                onConfirm={handleDeleteProduct}
                isLoading={isMutating}
            />

            {/* Breadcrumb */}
            <Breadcrumbs items={breadcrumbItems} />

            {/* Page Header */}
            <PageHeader
                title="Product Management"
                subtitle="Manage and monitor all products in your inventory"
            />

            <div className="p-6">
                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1 max-w-lg">
                            <SearchBar
                                value={filters.search}
                                onChange={(value) => setFilter("search", value)}
                                placeholder="Search by product name or Product ID..."
                            />
                        </div>

                        <div className="flex items-center gap-4">
                            <Button onClick={() => setIsFilterOpen(true)}>
                                Open Filters
                            </Button>

                            <FilterSheet
                                isOpen={isFilterOpen}
                                onClose={() => setIsFilterOpen(false)}
                                filters={filters}
                                setFilter={setFilter}
                                resetFilters={resetFilters}
                                schema={entitySchema.product}
                            />

                            <FilterDropdown
                                label="Columns"
                                options={columnOptions}
                                value={Array.from(visibleColumns).map(String)}
                                onChange={handleColumnChange}
                                multiple
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <Table
                    data={products}
                    columns={entitySchema.product.tableColumns}
                    visibleColumns={visibleColumns}
                    sortField={filters.sortBy}
                    sortDirection={filters.sortOrder}
                    toggleSort={toggleSort}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onView={handleView}
                />

                {/* Empty State */}
                {products.length === 0 && (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No products found
                        </h3>
                        <p className="text-gray-500">
                            {filters.search
                                ? "Try adjusting your search or filters."
                                : "Get started by creating your first product."}
                        </p>
                    </div>
                )}

                {/* Pagination */}
                <Pagination
                    pagination={pagination}
                    onPageChange={handlePageChange}
                    onItemsPerPageChange={handleItemsPerPageChange}
                />
            </div>
        </div>
    );
}
