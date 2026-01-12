// @/lib/api/axios.ts
import { asyncErrorHandler } from "@/lib/utils";
import axios, { AxiosRequestConfig } from "axios";

export const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/",
  timeout: 60000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export const axiosClient = {
  get: <T>(url: string, config?: AxiosRequestConfig) => asyncErrorHandler<T>(() => axiosInstance.get(url, config)),
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig) => asyncErrorHandler<T>(() => axiosInstance.post(url, data, config)),
  put: <T>(url: string, data?: any, config?: AxiosRequestConfig) => asyncErrorHandler<T>(() => axiosInstance.put(url, data, config)),
  patch: <T>(url: string, data?: any, config?: AxiosRequestConfig) => asyncErrorHandler<T>(() => axiosInstance.patch(url, data, config)),
  delete: <T>(url: string, data?: any, config?: AxiosRequestConfig) => asyncErrorHandler<T>(() => axiosInstance.delete(url, { data, ...config })),
};

export default axiosClient;