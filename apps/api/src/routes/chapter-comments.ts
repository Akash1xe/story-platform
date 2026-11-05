import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/database.js";
import { requireAuthenticatedUser, type AuthSession } from "../middleware/auth.js";

const router = Router();
const commentBodySchema = z.object({ body: z.string().trim().min(1).max(1500) });
const chapterParamsSchema = z.object({
  slug: z.string().trim().min(1).max(100),
  chapterNumber: z.coerce.number().int().min(1),
});
const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
const authorSelection = { id: true, displayName: true, avatarUrl: true, creatorHandle: true };

function currentUserId(response: Response) {
  return (response.locals.authSession as AuthSession).user.id;
}

function parseChapterParams(request: Request, response: Response) {
  const parsed = chapterParamsSchema.safeParse(request.params);
  if (parsed.success) return parsed.data;

  response.status(400).json({
    error: { code: "INVALID_CHAPTER", message: "A valid story slug and positive chapter number are required." },
  });
  return null;
}

async function findPublishedChapter(slug: string, chapterNumber: number) {
  return prisma.chapter.findFirst({
    where: {
      number: chapterNumber,
      isPublished: true,
      story: { is: { slug, status: "PUBLISHED" } },
    },
    select: { id: true },
  });
}

router.get("/stories/:slug/chapters/:chapterNumber/comments", async (request, response, next) => {
  try {
    const params = parseChapterParams(request, response);
    if (!params) return;

    const pagination = paginationSchema.safeParse(request.query);
    if (!pagination.success) {
      response.status(400).json({
        error: { code: "INVALID_PAGINATION", message: "Page must be positive and limit must be between 1 and 50." },
      });
      return;
    }

    const chapter = await findPublishedChapter(params.slug, params.chapterNumber);
    if (!chapter) {
      response.status(404).json({
        error: { code: "CHAPTER_NOT_FOUND", message: "Comments are only available for published chapters." },
      });
      return;
    }

    const { page, limit } = pagination.data;
    const where = { chapterId: chapter.id, removedAt: null };
    const [comments, total] = await prisma.$transaction([
      prisma.chapterComment.findMany({
        where,
        include: { author: { select: authorSelection } },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.chapterComment.count({ where }),
    ]);

    response.status(200).json({
      comments,
      pagination: { page, limit, total, hasMore: page * limit < total },
    });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/stories/:slug/chapters/:chapterNumber/comments",
  requireAuthenticatedUser,
  async (request, response, next) => {
    try {
      const params = parseChapterParams(request, response);
      if (!params) return;

      const parsedBody = commentBodySchema.safeParse(request.body);
      if (!parsedBody.success) {
        response.status(400).json({
          error: { code: "INVALID_COMMENT", message: "Write a comment containing 1 to 1500 characters." },
        });
        return;
      }

      const chapter = await findPublishedChapter(params.slug, params.chapterNumber);
      if (!chapter) {
        response.status(404).json({
          error: { code: "CHAPTER_NOT_FOUND", message: "Comments can only be added to published chapters." },
        });
        return;
      }

      const comment = await prisma.chapterComment.create({
        data: {
          chapterId: chapter.id,
          authorId: currentUserId(response),
          body: parsedBody.data.body,
        },
        include: { author: { select: authorSelection } },
      });

      response.status(201).json({ comment });
    } catch (error) {
      next(error);
    }
  },
);

router.patch("/chapter-comments/:commentId", requireAuthenticatedUser, async (request, response, next) => {
  try {
    const parsedId = z.string().trim().min(1).max(64).safeParse(request.params.commentId);
    const parsedBody = commentBodySchema.safeParse(request.body);
    if (!parsedId.success || !parsedBody.success) {
      response.status(400).json({
        error: { code: "INVALID_COMMENT", message: "A valid comment ID and 1 to 1500 characters are required." },
      });
      return;
    }

    const authorId = currentUserId(response);
    const existing = await prisma.chapterComment.findFirst({
      where: {
        id: parsedId.data,
        authorId,
        removedAt: null,
        chapter: { is: { isPublished: true, story: { is: { status: "PUBLISHED" } } } },
      },
      select: { id: true },
    });
    if (!existing) {
      response.status(404).json({
        error: { code: "COMMENT_NOT_FOUND", message: "This comment cannot be found or edited by your account." },
      });
      return;
    }

    const comment = await prisma.chapterComment.update({
      where: { id: existing.id },
      data: { body: parsedBody.data.body },
      include: { author: { select: authorSelection } },
    });
    response.status(200).json({ comment });
  } catch (error) {
    next(error);
  }
});

router.delete("/chapter-comments/:commentId", requireAuthenticatedUser, async (request, response, next) => {
  try {
    const parsedId = z.string().trim().min(1).max(64).safeParse(request.params.commentId);
    if (!parsedId.success) {
      response.status(400).json({
        error: { code: "INVALID_COMMENT", message: "A valid comment ID is required." },
      });
      return;
    }

    const existing = await prisma.chapterComment.findFirst({
      where: {
        id: parsedId.data,
        authorId: currentUserId(response),
        removedAt: null,
        chapter: { is: { isPublished: true, story: { is: { status: "PUBLISHED" } } } },
      },
      select: { id: true },
    });
    if (!existing) {
      response.status(404).json({
        error: { code: "COMMENT_NOT_FOUND", message: "This comment cannot be found or deleted by your account." },
      });
      return;
    }

    await prisma.chapterComment.delete({ where: { id: existing.id } });
    response.status(200).json({ deleted: true });
  } catch (error) {
    next(error);
  }
});

export default router;
