import Express from "express";
import cors from "cors";
import db from "./lib/config/db/index.js";
import cookieParser from "cookie-parser";
import { apiRouter } from "./routes/index.js";
import { errorHandler } from "./lib/middlewares/index.js";

const app = Express();
const PORT = process.env.PORT!

db();

app.use(
    cors({
        origin: [
            process.env.CLIENT_URL || "http://localhost:3000", "http://localhost:3001", "http://localhost:3002",
            "https://sacred-foal-secondly.ngrok-free.app",
        ],
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allowedHeaders: ["Content-Type", "Authorization"],
    }))
    .use(Express.json())
    .use(Express.urlencoded({ extended: true }))
    .use(cookieParser())
    .use(apiRouter)
    .use(errorHandler)
    .get("/health", (_, res) => res.json({ status: "ok" }))

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`)
})