import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import { toNodeHandler } from "better-auth/node";
import { env } from "./config/env.js";
import { requireAuthenticatedUser, type AuthSession } from "./middleware/auth.js";
import { auth } from "./lib/auth.js";
import { prisma } from "./lib/database.js";
import creatorStoriesRouter from "./routes/creator-stories.js";
import creatorProfileRouter from "./routes/creator-profile.js";
import creatorFollowsRouter from "./routes/creator-follows.js";
import moderationRouter from "./routes/moderation.js";
import publicStoriesRouter from "./routes/public-stories.js";
import publicCreatorsRouter from "./routes/public-creators.js";
import readerLibraryRouter from "./routes/reader-library.js";
import chapterCommentsRouter from "./routes/chapter-comments.js";
import notificationsRouter from "./routes/notifications.js";
import contentReportsRouter from "./routes/content-reports.js";
import storyRatingsRouter from "./routes/story-ratings.js";

export const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }));

// Better Auth consumes the request body itself, so mount it before express.json().
app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json({ limit: "10mb" }));

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

app.get("/api/v1/me", requireAuthenticatedUser, (_request, response) => {
  const session = response.locals.authSession as AuthSession;

  response.status(200).json({
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
      role: session.user.role,
    },
    session: {
      expiresAt: session.session.expiresAt,
    },
  });
});

app.use("/api/v1/stories", publicStoriesRouter);
app.use("/api/v1/creators", publicCreatorsRouter);
app.use("/api/v1/creator/stories", creatorStoriesRouter);
app.use("/api/v1/creator/profile", creatorProfileRouter);
app.use("/api/v1/following", creatorFollowsRouter);
app.use("/api/v1/moderation/reviews", moderationRouter);
app.use("/api/v1", chapterCommentsRouter);
app.use("/api/v1/notifications", notificationsRouter);
app.use("/api/v1/reports", contentReportsRouter);
app.use("/api/v1/ratings", storyRatingsRouter);
app.use("/api/v1", readerLibraryRouter);

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
