import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

import authRoutes from "./routes/authRoutes";
import complaintRoutes from "./routes/complaintRoutes";
import workerRoutes from "./routes/workerRoutes";
import analyticsRoutes from "./routes/analyticsRoutes";
import civicRoutes from "./routes/civicRoutes";

const app = express();
const PORT = process.env.PORT || 5000;
const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR || "./uploads");

// Middlewares
app.use(
  cors({
    origin: "*", // allow requests from frontend during development
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded static files
app.use("/uploads", express.static(uploadDir));

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "NagrikConnect Backend API",
    version: "1.0.1",
    timestamp: new Date().toISOString(),
  });
});

// Mount API routes
app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/workers", workerRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/civic", civicRoutes);

// Root greeting
app.get("/", (_req: Request, res: Response) => {
  res.json({
    name: "NagrikConnect API Server",
    description: "Smart City Civic Grievance & Information Management System",
    documentation: "/api/health",
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "API route not found." });
});

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error occurred.",
  });
});

app.listen(PORT, () => {
  console.log(`🚀 NagrikConnect backend server running at http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
});
