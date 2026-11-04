import { Router, type Response } from "express";
import { z } from "zod";
import type { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/database.js";
import { requireAuthenticatedUser, requireRoles, type AuthSession } from "../middleware/auth.js";

const router = Router();

const reviewInclude = {
  author: {
    select: { id: true, displayName: true },
  },
  genres: {
    include: { genre: true },
  },
  chapters: {
    include: {
      panels: {
        orderBy: { position: "asc" as const },
      },
    },
    orderBy: { number: "asc" as const },
  },
  moderationReviews: {
    include: {
      reviewer: {
        select: { id: true, displayName: true },
      },
    },
    orderBy: { createdAt: "desc" as const },
    take: 1,
  },
};

const decisionSchema = z.object({
  decision: z.enum(["APPROVED", "CHANGES_REQUESTED"]),
  note: z.string().trim().max(5_000).optional().default(""),
}).superRefine((value, context) => {
  if (value.decision === "CHANGES_REQUESTED" && value.note.length < 12) {
    context.addIssue({
      code: "custom",
      path: ["note"],
      message: "Add at least 12 characters explaining what the creator should change.",
    });
  }
});

function getSession(response: Response): AuthSession {
  return response.locals.authSession as AuthSession;
}

router.use(requireAuthenticatedUser, requireRoles("MODERATOR", "ADMIN"));

router.get("/", async (request, response, next) => {
  try {
    const filter = z.enum(["Pending", "Reviewed", "All"]).safeParse(
      request.query.filter ?? "Pending",
    );

    if (!filter.success) {
      response.status(400).json({
        error: {
          code: "INVALID_REVIEW_FILTER",
          message: "Choose Pending, Reviewed or All submissions.",
        },
      });
      return;
    }

    const where: Prisma.StoryWhereInput =
      filter.data === "Pending"
        ? { status: "IN_REVIEW" as const }
        : filter.data === "Reviewed"
          ? {
              status: { in: ["DRAFT", "PUBLISHED", "ARCHIVED"] },
              moderationReviews: { some: {} },
            }
          : {
              OR: [
                { status: "IN_REVIEW" as const },
                { moderationReviews: { some: {} } },
              ],
            };

    const submissions = await prisma.story.findMany({
      where,
      include: reviewInclude,
      orderBy: filter.data === "Pending" ? { updatedAt: "asc" } : { updatedAt: "desc" },
    });

    response.status(200).json({ submissions });
  } catch (error) {
    next(error);
  }
});

router.post("/:storyId/decision", async (request, response, next) => {
  try {
    const parsed = decisionSchema.safeParse(request.body);

    if (!parsed.success) {
      response.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: parsed.error.issues[0]?.message ?? "Check the moderation decision.",
          details: parsed.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
      });
      return;
    }

    const session = getSession(response);
    const { decision, note } = parsed.data;
    const now = new Date();

    const result = await prisma.$transaction(async (transaction) => {
      // The status predicate makes this transition atomic: only one moderator
      // can decide a submission that is currently waiting for review.
      const updatedCount = await transaction.story.updateMany({
        where: {
          id: request.params.storyId,
          status: "IN_REVIEW",
        },
        data: decision === "APPROVED"
          ? { status: "PUBLISHED", publishedAt: now }
          : { status: "DRAFT", publishedAt: null },
      });

      if (updatedCount.count !== 1) {
        const existing = await transaction.story.findUnique({
          where: { id: request.params.storyId },
          select: { id: true, status: true },
        });

        return existing
          ? { kind: "not_pending" as const, status: existing.status }
          : { kind: "not_found" as const };
      }

      await transaction.chapter.updateMany({
        where: { storyId: request.params.storyId },
        data: decision === "APPROVED"
          ? { isPublished: true, publishedAt: now }
          : { isPublished: false, publishedAt: null },
      });

      await transaction.moderationReview.create({
        data: {
          storyId: request.params.storyId,
          reviewerId: session.user.id,
          decision,
          note: note || null,
        },
      });

      const submission = await transaction.story.findUniqueOrThrow({
        where: { id: request.params.storyId },
        include: reviewInclude,
      });

      return { kind: "decided" as const, submission };
    });

    if (result.kind === "not_found") {
      response.status(404).json({
        error: { code: "SUBMISSION_NOT_FOUND", message: "This submission could not be found." },
      });
      return;
    }

    if (result.kind === "not_pending") {
      response.status(409).json({
        error: {
          code: "SUBMISSION_ALREADY_REVIEWED",
          message: "This submission is no longer waiting for review. Refresh the queue before deciding again.",
          status: result.status,
        },
      });
      return;
    }

    response.status(200).json({ submission: result.submission });
  } catch (error) {
    next(error);
  }
});

export default router;
