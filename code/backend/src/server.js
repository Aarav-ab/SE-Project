import "dotenv/config";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { authRouter } from "./auth.js";
import { complaintsRouter } from "./complaints.js";
import { profileRouter } from "./profile.js";
import { initializeDatabase, pool } from "./db.js";

const app = express();
const port = Number(process.env.PORT ?? 3001);
const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";

app.disable("x-powered-by");
app.set("trust proxy", process.env.NODE_ENV === "production" ? 1 : false);
app.use(helmet());
app.use(cors({ origin: frontendUrl, credentials: true }));
app.use("/api", (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use((req, res, next) => {
  const origin = req.get("origin");
  if (["POST", "PATCH", "PUT", "DELETE"].includes(req.method) && origin && origin !== frontendUrl) {
    res.status(403).json({ error: "Requests from this origin are not allowed." });
    return;
  }
  next();
});
app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false }));
app.use("/api/auth", authRouter);
app.use("/api/complaints", complaintsRouter);
app.use("/api/profile", profileRouter);
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.use((error, _req, res, _next) => {
  if (error instanceof SyntaxError && "body" in error) {
    res.status(400).json({ error: "Request body must contain valid JSON." });
    return;
  }
  if (error.name === "MulterError") {
    const message = error.code === "LIMIT_FILE_SIZE"
      ? "Each evidence file must be 25 MB or smaller."
      : error.code === "LIMIT_FILE_COUNT"
        ? "You can attach up to 5 evidence files."
        : error.message;
    res.status(400).json({ error: message });
    return;
  }
  const status = Number.isInteger(error.status) ? error.status : 500;
  if (status >= 500) console.error(error);
  res.status(status).json({ error: status >= 500 ? "The server could not complete the request." : error.message });
});

await initializeDatabase();
const server = app.listen(port, () => {
  console.log(`NagrikConnect API listening on port ${port}`);
});

async function shutdown() {
  server.close();
  await pool.end();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
