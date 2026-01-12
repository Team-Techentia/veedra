// @/lib/utils/asyncErrorHandler.ts
import { ApiResponse } from '@/lib/types';
import { AxiosError, AxiosResponse } from 'axios';

export const asyncErrorHandler = async <T>(apiCall: () => Promise<AxiosResponse<ApiResponse<T>>>): Promise<ApiResponse<T>> => {
    try {
        const response = await apiCall();

        if (response.data.success) {
            return response.data;
        } else {
            return { success: false, message: response.data.message || 'Operation failed', error: response.data.error };
        }
    } catch (error) {
        const axiosError = error as AxiosError<ApiResponse>;
        let errorMessage = 'An unexpected error occurred';

        if (axiosError.response?.data?.message) {
            errorMessage = axiosError.response.data.message;
        } else if (axiosError.message) {
            if (axiosError.code === 'NETWORK_ERROR') {
                errorMessage = 'Network error. Please check your internet connection.';
            } else if (axiosError.code === 'ECONNABORTED') {
                errorMessage = 'Request timeout. Please try again.';
            } else {
                errorMessage = axiosError.message;
            }
        }

        return { success: false, message: errorMessage, error: axiosError };
    }
};