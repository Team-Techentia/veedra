// @/lib/config/db/mongoose.ts
import "server-only"
import mongoose, { Mongoose } from "mongoose";

const MONGO_URL = process.env.MONGO_URL!;

if (!MONGO_URL) {
    throw new Error("Please define the MONGO_URL environment variable");
}

declare global {
    var mongoose: { conn: Mongoose | null; promise: Promise<Mongoose> | null; } | undefined;
}

const cached = global.mongoose ?? { conn: null, promise: null };
global.mongoose = cached;

async function dbConnect(): Promise<Mongoose> {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGO_URL, { bufferCommands: false, });
    }

    cached.conn = await cached.promise;
    return cached.conn;
}
export default dbConnect;