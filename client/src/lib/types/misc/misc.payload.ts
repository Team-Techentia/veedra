import { NextApiRequest } from "next";
import { UserType } from "../user/user.types";

export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: unknown;
}

export interface AuthRequest extends NextApiRequest {
    user: UserType;
}

export interface PaginationResponse {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
}