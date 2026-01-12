export class AppError extends Error {
    statusCode: number;

    constructor(message: string, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;

        // 👇 ensures instanceof works
        Object.setPrototypeOf(this, new.target.prototype);
    }
}