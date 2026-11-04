import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/database.js";

const router = Router();

const publishedStoryWhere = {
  status: "PUBLISHED" as const,
  chapters: { some: { isPublished: true } },
};

const creatorStoryInclude = {
  author: { select: { id: true, displayName: true } },
  genres: { include: { genre: { select: { name: true, slug: true } } } },
  chapters: {
    where: { isPublished: true },
    select: { id: true, number: true, title: true },
    orderBy: { number: "asc" as const },
  },
  _count: { select: { chapters: { where: { isPublished: true } } } },
};

router.get("/:creatorId", async (request, response, next) => {
  try {
    const parsedId = z.string().trim().min(1).max(100).safeParse(request.params.creatorId);
    if (!parsedId.success) {
      response.status(400).json({
        error: { code: "INVALID_CREATOR", message: "A valid creator ID is required." },
      });
      return;
    }

    const creator = await prisma.user.findFirst({
      where: {
        id: parsedId.data,
        stories: { some: publishedStoryWhere },
      },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        createdAt: true,
        stories: {
          where: publishedStoryWhere,
          include: creatorStoryInclude,
          orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        },
      },
    });

    if (!creator) {
      response.status(404).json({
        error: { code: "CREATOR_NOT_FOUND", message: "This creator profile could not be found." },
      });
      return;
    }

    response.status(200).json({
      creator: {
        id: creator.id,
        displayName: creator.displayName,
        avatarUrl: creator.avatarUrl,
        joinedAt: creator.createdAt,
        stories: creator.stories,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
