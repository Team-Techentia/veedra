// lib/errors/AppError.ts
export class AppError extends Error {
    statusCode: number;
    err?: any;

    constructor(message: string, statusCode = 500, err?: any) {
        super(message);
        this.statusCode = statusCode;
        this.err = err;

        // Only for extending built-in Error
        Object.setPrototypeOf(this, new.target.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}