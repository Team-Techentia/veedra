import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import mongoose from "mongoose";
import { AppError } from "../../types/index.js";

export const errorHandler = (err: AppError | unknown, req: Request, res: Response, next: NextFunction) => {
    // console.error("Error:", err);
    let statusCode = (err as any).statusCode as number || 400;

    if (err instanceof ZodError) {
        return res.status(statusCode).json({ success: false, message: "Validation error", error: err.issues.map(e => ({ message: e.message, path: e.path })), });
    }

    if (err instanceof AppError) {
        return res.status(statusCode).json({ success: false, message: err.message, error: err })
    }

    if (err instanceof mongoose.Error.ValidationError) {
        return res.status(400).json({ success: false, message: "Database validation error", errors: Object.values(err.errors).map((e) => e.message), });
    }

    if (err instanceof mongoose.Error.CastError) {
        return res.status(400).json({ success: false, message: "Invalid ID format", path: err.path, value: err.value, });
    }

    // MongoDB duplicate key error
    const error = err as any;
    if (error.code === 11000 || error.name === 'MongoServerError' || (error.message && error.message.includes('E11000'))) {
        const duplicateFields = error.keyValue || {};
        const fieldsList = Object.keys(duplicateFields);

        let message = '';
        if (fieldsList.length === 1) {
            message = `Duplicate value for field '${fieldsList[0]}'`;
        } else if (fieldsList.length > 1) {
            message = `Duplicate combination: ${fieldsList.map((field) => `${field}='${duplicateFields[field]}'`).join(', ')}`;
        } else {
            message = 'Duplicate entry detected';
        }

        return res.status(409).json({ success: false, message, fields: duplicateFields, error: `MongoDB error: ${error.message}`, });
    }

    return res.status(500).json({ success: false, message: "Internal server error", error: (err as Error).message, });
};