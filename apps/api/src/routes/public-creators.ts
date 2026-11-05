import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/database.js";

const router = Router();

const publishedStoryWhere = {
  status: "PUBLISHED" as const,
  chapters: { some: { isPublished: true } },
};

const creatorStoryInclude = {
  author: { select: { id: true, displayName: true, creatorHandle: true } },
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
        OR: [{ id: parsedId.data }, { creatorHandle: parsedId.data }],
        stories: { some: publishedStoryWhere },
      },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        creatorHandle: true,
        creatorBio: true,
        creatorWebsiteUrl: true,
        createdAt: true,
        _count: { select: { creatorFollowers: true } },
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

    const ratingRows = creator.stories.length
      ? await prisma.storyRating.groupBy({
          by: ["storyId"],
          where: { storyId: { in: creator.stories.map((story) => story.id) } },
          _avg: { value: true },
          _count: { _all: true },
        })
      : [];
    const ratingsByStoryId = new Map(
      ratingRows.map((row) => [
        row.storyId,
        {
          averageRating: row._avg.value === null
            ? null
            : Math.round(row._avg.value * 10) / 10,
          ratingCount: row._count._all,
        },
      ]),
    );

    response.status(200).json({
      creator: {
        id: creator.id,
        displayName: creator.displayName,
        avatarUrl: creator.avatarUrl,
        handle: creator.creatorHandle,
        bio: creator.creatorBio,
        websiteUrl: creator.creatorWebsiteUrl,
        joinedAt: creator.createdAt,
        followersCount: creator._count.creatorFollowers,
        stories: creator.stories.map((story) => ({
          ...story,
          ratingSummary: ratingsByStoryId.get(story.id) ?? {
            averageRating: null,
            ratingCount: 0,
          },
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
