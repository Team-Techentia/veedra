// @/app/admin/products/_components/DeleteProductModal.tsx
import { FormActions, FormCancelButton } from "@/components";
import { BaseModal } from "@/components";
import { ProductType } from "@/lib/types";
import { AlertTriangle, Trash2, X } from "lucide-react";

interface DeleteProductModalProps {
    isOpen: boolean;
    closeModal: () => void;
    product: ProductType | null;
    onConfirm: (id: string) => Promise<void>;
    isLoading?: boolean;
}

export function DeleteProductModal({
    isOpen,
    closeModal,
    product: selectedProduct,
    onConfirm,
    isLoading = false
}: DeleteProductModalProps) {
    const handleConfirm = async () => {
        if (!selectedProduct?._id) return;

        try {
            await onConfirm(selectedProduct._id);
            closeModal();
        } catch (error) {
            console.error('Error deleting product:', error);
        }
    };

    if (!selectedProduct) return null;

    return (
        <BaseModal isOpen={isOpen} closeModal={closeModal} className="w-full max-w-md">
            <div className="bg-white rounded-lg shadow-xl">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center">
                        <AlertTriangle className="w-6 h-6 text-red-500 mr-2" />
                        <h2 className="text-xl font-semibold text-gray-900">Delete Product</h2>
                    </div>
                    <button
                        onClick={closeModal}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-sm text-gray-600 mb-4">
                        Are you sure you want to delete the product "{selectedProduct.name}"? This action cannot be undone.
                    </p>

                    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                        <div className="flex">
                            <AlertTriangle className="w-5 h-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="text-sm font-medium text-red-800">Warning</h3>
                                <p className="text-sm text-red-700 mt-1">
                                    This will permanently delete the product, all its variants, and associated data.
                                </p>
                            </div>
                        </div>
                    </div>

                    <FormActions>
                        <FormCancelButton onClick={closeModal} disabled={isLoading}>
                            Cancel
                        </FormCancelButton>
                        <button
                            onClick={handleConfirm}
                            disabled={isLoading}
                            className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Product
                                </>
                            )}
                        </button>
                    </FormActions>
                </div>
            </div>
        </BaseModal>
    );
}