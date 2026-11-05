import { Router, type Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/database.js";
import { requireAuthenticatedUser, type AuthSession } from "../middleware/auth.js";

const router = Router();
const publishedStoryWhere = {
  status: "PUBLISHED" as const,
  chapters: { some: { isPublished: true } },
};
const ratingSchema = z.object({
  value: z.number().int().min(1).max(5),
});

function currentUserId(response: Response) {
  return (response.locals.authSession as AuthSession).user.id;
}

function ratingError(response: Response, status: number, code: string, message: string) {
  response.status(status).json({ error: { code, message } });
}

async function findPublishedStory(slug: string) {
  return prisma.story.findFirst({
    where: { slug, ...publishedStoryWhere },
    select: { id: true, authorId: true },
  });
}

async function getRatingSummary(storyId: string) {
  const aggregate = await prisma.storyRating.aggregate({
    where: { storyId },
    _avg: { value: true },
    _count: { _all: true },
  });

  return {
    averageRating: aggregate._avg.value === null
      ? null
      : Math.round(aggregate._avg.value * 10) / 10,
    ratingCount: aggregate._count._all,
  };
}

router.get("/:storySlug", async (request, response, next) => {
  try {
    const slug = z.string().trim().min(1).max(100).safeParse(request.params.storySlug);
    if (!slug.success) {
      ratingError(response, 400, "INVALID_STORY", "A valid story slug is required.");
      return;
    }

    const story = await findPublishedStory(slug.data);
    if (!story) {
      ratingError(response, 404, "STORY_NOT_FOUND", "Ratings are only available for published stories.");
      return;
    }

    response.status(200).json({ summary: await getRatingSummary(story.id) });
  } catch (error) {
    next(error);
  }
});

router.get(
  "/:storySlug/me",
  requireAuthenticatedUser,
  async (request, response, next) => {
    try {
      const slug = z.string().trim().min(1).max(100).safeParse(request.params.storySlug);
      if (!slug.success) {
        ratingError(response, 400, "INVALID_STORY", "A valid story slug is required.");
        return;
      }

      const story = await findPublishedStory(slug.data);
      if (!story) {
        ratingError(response, 404, "STORY_NOT_FOUND", "Ratings are only available for published stories.");
        return;
      }

      const rating = await prisma.storyRating.findUnique({
        where: {
          userId_storyId: {
            userId: currentUserId(response),
            storyId: story.id,
          },
        },
        select: { value: true, updatedAt: true },
      });

      response.status(200).json({ rating });
    } catch (error) {
      next(error);
    }
  },
);

router.put(
  "/:storySlug",
  requireAuthenticatedUser,
  async (request, response, next) => {
    try {
      const slug = z.string().trim().min(1).max(100).safeParse(request.params.storySlug);
      const parsed = ratingSchema.safeParse(request.body);
      if (!slug.success || !parsed.success) {
        ratingError(response, 400, "INVALID_RATING", "Choose a whole-star rating from 1 to 5.");
        return;
      }

      const story = await findPublishedStory(slug.data);
      if (!story) {
        ratingError(response, 404, "STORY_NOT_FOUND", "Only published stories can be rated.");
        return;
      }

      const userId = currentUserId(response);
      if (story.authorId === userId) {
        ratingError(response, 403, "CANNOT_RATE_OWN_STORY", "You cannot rate your own story.");
        return;
      }

      const rating = await prisma.storyRating.upsert({
        where: { userId_storyId: { userId, storyId: story.id } },
        create: { userId, storyId: story.id, value: parsed.data.value },
        update: { value: parsed.data.value },
        select: { value: true, updatedAt: true },
      });

      response.status(200).json({
        rating,
        summary: await getRatingSummary(story.id),
      });
    } catch (error) {
      next(error);
    }
  },
);

router.delete(
  "/:storySlug",
  requireAuthenticatedUser,
  async (request, response, next) => {
    try {
      const slug = z.string().trim().min(1).max(100).safeParse(request.params.storySlug);
      if (!slug.success) {
        ratingError(response, 400, "INVALID_STORY", "A valid story slug is required.");
        return;
      }

      const story = await findPublishedStory(slug.data);
      if (!story) {
        ratingError(response, 404, "STORY_NOT_FOUND", "Ratings are only available for published stories.");
        return;
      }

      await prisma.storyRating.deleteMany({
        where: { userId: currentUserId(response), storyId: story.id },
      });

      response.status(200).json({ summary: await getRatingSummary(story.id) });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
