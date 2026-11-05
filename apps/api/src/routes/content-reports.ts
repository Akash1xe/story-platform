import { Router, type Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/database.js";
import { requireAuthenticatedUser, requireRoles, type AuthSession } from "../middleware/auth.js";

const router = Router();

const reasonSchema = z.enum([
  "SPAM",
  "HARASSMENT",
  "HATE_SPEECH",
  "SEXUAL_CONTENT",
  "VIOLENCE",
  "COPYRIGHT",
  "OTHER",
]);

const createReportSchema = z.discriminatedUnion("targetType", [
  z.object({
    targetType: z.literal("STORY"),
    targetId: z.string().trim().min(1).max(64),
    reason: reasonSchema,
    details: z.string().trim().max(1000).optional().default(""),
  }),
  z.object({
    targetType: z.literal("CHAPTER_COMMENT"),
    targetId: z.string().trim().min(1).max(64),
    reason: reasonSchema,
    details: z.string().trim().max(1000).optional().default(""),
  }),
]);

const listSchema = z.object({
  filter: z.enum(["Pending", "Reviewed", "All"]).default("Pending"),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const decisionSchema = z.object({
  decision: z.enum(["RESOLVED", "DISMISSED"]),
  note: z.string().trim().max(2000).optional().default(""),
});

function currentUserId(response: Response) {
  return (response.locals.authSession as AuthSession).user.id;
}

function reportError(
  response: Response,
  status: number,
  code: string,
  message: string,
) {
  response.status(status).json({ error: { code, message } });
}

router.post("/", requireAuthenticatedUser, async (request, response, next) => {
  try {
    const parsed = createReportSchema.safeParse(request.body);
    if (!parsed.success) {
      reportError(
        response,
        400,
        "INVALID_REPORT",
        "Choose a valid report reason and a published story or chapter comment.",
      );
      return;
    }

    const reporterId = currentUserId(response);
    const input = parsed.data;
    let targetTitle: string;
    let targetExcerpt: string;
    let targetUrl: string;
    let targetAuthorId: string;

    if (input.targetType === "STORY") {
      const story = await prisma.story.findFirst({
        where: {
          id: input.targetId,
          status: "PUBLISHED",
          chapters: { some: { isPublished: true } },
        },
        select: {
          id: true,
          slug: true,
          title: true,
          synopsis: true,
          authorId: true,
        },
      });

      if (!story) {
        reportError(response, 404, "CONTENT_NOT_FOUND", "This published story could not be found.");
        return;
      }

      targetAuthorId = story.authorId;
      targetTitle = story.title;
      targetExcerpt = story.synopsis.slice(0, 1200);
      targetUrl = "/stories/" + encodeURIComponent(story.slug);
    } else {
      const comment = await prisma.chapterComment.findFirst({
        where: {
          id: input.targetId,
          chapter: {
            is: {
              isPublished: true,
              story: { is: { status: "PUBLISHED" } },
            },
          },
        },
        select: {
          id: true,
          body: true,
          authorId: true,
          chapter: {
            select: {
              number: true,
              story: { select: { slug: true, title: true } },
            },
          },
        },
      });

      if (!comment) {
        reportError(response, 404, "CONTENT_NOT_FOUND", "This published chapter comment could not be found.");
        return;
      }

      targetAuthorId = comment.authorId;
      targetTitle = comment.chapter.story.title + " · Chapter " + comment.chapter.number + " comment";
      targetExcerpt = comment.body.slice(0, 1200);
      targetUrl =
        "/stories/" +
        encodeURIComponent(comment.chapter.story.slug) +
        "/read/" +
        comment.chapter.number;
    }

    if (targetAuthorId === reporterId) {
      reportError(response, 403, "CANNOT_REPORT_OWN_CONTENT", "You cannot report content you created.");
      return;
    }

    const duplicate = await prisma.contentReport.findFirst({
      where: {
        reporterId,
        targetType: input.targetType,
        targetId: input.targetId,
        status: "PENDING",
      },
      select: { id: true },
    });

    if (duplicate) {
      reportError(response, 409, "REPORT_ALREADY_PENDING", "You have already reported this content. A moderator will review it.");
      return;
    }

    const report = await prisma.contentReport.create({
      data: {
        reporterId,
        targetType: input.targetType,
        targetId: input.targetId,
        targetTitle,
        targetExcerpt,
        targetUrl,
        reason: input.reason,
        details: input.details || null,
      },
      select: { id: true, status: true, createdAt: true },
    });

    response.status(201).json({ report });
  } catch (error) {
    next(error);
  }
});

router.get(
  "/moderation",
  requireAuthenticatedUser,
  requireRoles("MODERATOR", "ADMIN"),
  async (request, response, next) => {
    try {
      const parsed = listSchema.safeParse(request.query);
      if (!parsed.success) {
        reportError(response, 400, "INVALID_REPORT_FILTER", "Choose Pending, Reviewed or All and valid pagination values.");
        return;
      }

      const { filter, page, limit } = parsed.data;
      const where =
        filter === "Pending"
          ? { status: "PENDING" as const }
          : filter === "Reviewed"
            ? { status: { in: ["RESOLVED", "DISMISSED"] as const } }
            : {};

      const [reports, total, pendingCount, resolvedCount, dismissedCount] =
        await prisma.$transaction([
          prisma.contentReport.findMany({
            where,
            include: {
              reporter: { select: { id: true, displayName: true } },
              reviewer: { select: { id: true, displayName: true } },
            },
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            skip: (page - 1) * limit,
            take: limit,
          }),
          prisma.contentReport.count({ where }),
          prisma.contentReport.count({ where: { status: "PENDING" } }),
          prisma.contentReport.count({ where: { status: "RESOLVED" } }),
          prisma.contentReport.count({ where: { status: "DISMISSED" } }),
        ]);

      response.status(200).json({
        reports,
        counts: {
          pending: pendingCount,
          resolved: resolvedCount,
          dismissed: dismissedCount,
        },
        pagination: { page, limit, total, hasMore: page * limit < total },
      });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/moderation/:reportId/decision",
  requireAuthenticatedUser,
  requireRoles("MODERATOR", "ADMIN"),
  async (request, response, next) => {
    try {
      const reportId = z.string().trim().min(1).max(64).safeParse(request.params.reportId);
      const parsed = decisionSchema.safeParse(request.body);
      if (!reportId.success || !parsed.success) {
        reportError(response, 400, "INVALID_REPORT_DECISION", "Choose Resolve or Dismiss and provide a valid report ID.");
        return;
      }

      const result = await prisma.contentReport.updateMany({
        where: { id: reportId.data, status: "PENDING" },
        data: {
          status: parsed.data.decision,
          decisionNote: parsed.data.note || null,
          reviewerId: currentUserId(response),
          reviewedAt: new Date(),
        },
      });

      if (result.count !== 1) {
        const existing = await prisma.contentReport.findUnique({
          where: { id: reportId.data },
          select: { id: true },
        });
        reportError(
          response,
          existing ? 409 : 404,
          existing ? "REPORT_ALREADY_REVIEWED" : "REPORT_NOT_FOUND",
          existing
            ? "This report has already been reviewed. Refresh the queue."
            : "This report could not be found.",
        );
        return;
      }

      const report = await prisma.contentReport.findUniqueOrThrow({
        where: { id: reportId.data },
        include: {
          reporter: { select: { id: true, displayName: true } },
          reviewer: { select: { id: true, displayName: true } },
        },
      });

      response.status(200).json({ report });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
