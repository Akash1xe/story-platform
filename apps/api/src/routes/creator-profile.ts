import { Router, type Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/database.js";
import { requireAuthenticatedUser, requireRoles, type AuthSession } from "../middleware/auth.js";

const router = Router();

const httpUrlSchema = z.string().trim().url().max(2_048).refine((value) => {
  const protocol = new URL(value).protocol;
  return protocol === "http:" || protocol === "https:";
}, "URLs must use HTTP or HTTPS.");

const optionalUrlSchema = z.union([z.literal(""), httpUrlSchema]).default("");

const profileSchema = z.object({
  displayName: z.string().trim().min(2).max(60),
  avatarUrl: optionalUrlSchema,
  handle: z.string().trim().toLowerCase().min(3).max(30)
    .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])$/, "Use 3–30 lowercase letters, numbers or hyphens; start and end with a letter or number."),
  bio: z.string().trim().max(500).default(""),
  websiteUrl: optionalUrlSchema,
});

function getSession(response: Response): AuthSession {
  return response.locals.authSession as AuthSession;
}

function suggestedHandle(displayName: string, userId: string): string {
  const base = displayName
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 22);
  return (base || "creator") + "-" + userId.slice(-6).toLowerCase();
}

function toProfile(user: {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  creatorHandle: string | null;
  creatorBio: string | null;
  creatorWebsiteUrl: string | null;
  createdAt: Date;
}) {
  return {
    userId: user.id,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    handle: user.creatorHandle ?? suggestedHandle(user.displayName, user.id),
    bio: user.creatorBio ?? "",
    websiteUrl: user.creatorWebsiteUrl ?? "",
    joinedAt: user.createdAt,
  };
}

router.use(
  requireAuthenticatedUser,
  requireRoles("CREATOR", "MODERATOR", "ADMIN"),
);

router.get("/", async (_request, response, next) => {
  try {
    const session = getSession(response);
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        creatorHandle: true,
        creatorBio: true,
        creatorWebsiteUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      response.status(404).json({
        error: { code: "PROFILE_NOT_FOUND", message: "Your creator profile could not be found." },
      });
      return;
    }

    response.status(200).json({ profile: toProfile(user) });
  } catch (error) {
    next(error);
  }
});

router.put("/", async (request, response, next) => {
  try {
    const parsed = profileSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Check the profile fields and try again.",
          details: parsed.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
      });
      return;
    }

    const session = getSession(response);
    const input = parsed.data;
    const duplicate = await prisma.user.findFirst({
      where: {
        creatorHandle: input.handle,
        id: { not: session.user.id },
      },
      select: { id: true },
    });

    if (duplicate) {
      response.status(409).json({
        error: { code: "HANDLE_TAKEN", message: "That creator handle is already in use." },
      });
      return;
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        displayName: input.displayName,
        avatarUrl: input.avatarUrl || null,
        creatorHandle: input.handle,
        creatorBio: input.bio || null,
        creatorWebsiteUrl: input.websiteUrl || null,
      },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        creatorHandle: true,
        creatorBio: true,
        creatorWebsiteUrl: true,
        createdAt: true,
      },
    });

    response.status(200).json({ profile: toProfile(user) });
  } catch (error) {
    next(error);
  }
});

export default router;
