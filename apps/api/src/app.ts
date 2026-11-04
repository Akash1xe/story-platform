import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { prisma } from "./lib/database.js";

export const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/v1/health", (_request, response) => {
  response.status(200).json({
    status: "ok",
    service: "story-platform-api",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/v1/ready", async (_request, response, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    response.status(200).json({ status: "ready", database: "connected" });
  } catch (error) {
    next(error);
  }
});

app.use((_request, response) => {
  response.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: "The requested API route was not found.",
    },
  });
});

app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  console.error("Unhandled API error:", error);
  response.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected server error occurred.",
    },
  });
});
