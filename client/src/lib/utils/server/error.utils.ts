import { AppError } from "@/lib/types";
import { AxiosError } from "axios";
// import mongoose from "mongoose";
import { ZodError } from "zod";

export const errorHandler = (error: any) => {

    if (error instanceof AppError) {
        return { status: error.statusCode, body: { success: false, message: error.message, error } };
    }

    if (error instanceof ZodError) {
        return {
            status: 400, body: {
                success: false, message: "Validation failed: " + error.issues[0].message,
                // error:error.message,
                error: error.issues.map(e => ({
                    path: e.path.join("."),   // e.g. "priceUsd" or "user.email"
                    message: e.message
                }))
            }
        };
    }

    if (error instanceof AxiosError) {
        return { status: error.status ?? 400, body: { success: false, message: error.message, error: error } };
    }

    // if (error instanceof mongoose.Error.ValidationError) {
    //     return { status: 400, body: { success: false, message: "Database validation error", error: error } };
    // }

    if (error.code && error.code === 11000) {
        return { status: 409, body: { success: false, message: "Duplicate key errorr", error: error?.keyValue } };
    }

    return { status: 500, body: { success: false, message: "Internal server error", error: error?.message || "Unknown error" } };
}