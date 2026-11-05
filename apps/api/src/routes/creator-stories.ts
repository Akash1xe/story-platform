import { randomUUID } from "node:crypto";
import { Router, type Request, type Response } from "express";
import { z } from "zod";
import type { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/database.js";
import { requireAuthenticatedUser, requireRoles, type AuthSession } from "../middleware/auth.js";

const router = Router();

const panelSchema = z.string().url().max(2_048).refine(
  (value) => {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  },
  "Panel image URLs must use HTTP or HTTPS.",
);

const chapterSchema = z.object({
  title: z.string().trim().min(1).max(120),
  summary: z.string().trim().max(300).default(""),
  body: z.string().max(500_000).default(""),
  panelUrls: z.array(panelSchema).max(100).default([]),
  panelAltTexts: z.array(z.string().trim().max(500)).max(100).default([]),
  panelCaptions: z.array(z.string().trim().max(500)).max(100).default([]),
});

const storySchema = z.object({
  title: z.string().trim().max(90).default(""),
  synopsis: z.string().trim().max(500).default(""),
  genre: z.string().trim().max(50).default(""),
  format: z.enum(["Comic", "Novel", "Short story"]),
  publicationStatus: z.enum(["Ongoing", "Completed"]).default("Ongoing"),
  coverImage: z.union([z.literal(""), z.string().url().max(2_048)]).default(""),
  chapters: z.array(chapterSchema).max(300).default([]),
}).superRefine((story, context) => {
  story.chapters.forEach((chapter, index) => {
    if (story.format === "Comic" && chapter.panelUrls.length === 0) {
      context.addIssue({
        code: "custom",
        path: ["chapters", index, "panelUrls"],
        message: "Every comic episode needs at least one panel image.",
      });
    }

    if (story.format !== "Comic" && !chapter.body.trim()) {
      context.addIssue({
        code: "custom",
        path: ["chapters", index, "body"],
        message: "Every prose chapter needs body text.",
      });
    }
  });
});

type StoryInput = z.infer<typeof storySchema>;

const storyInclude = {
  genres: { include: { genre: true } },
  chapters: {
    include: {
      panels: { orderBy: { position: "asc" as const } },
    },
    orderBy: { number: "asc" as const },
  },
  moderationReviews: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
  },
};

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 70) || "story";
}

function genreRelation(name: string) {
  if (!name) return undefined;

  return {
    create: {
      genre: {
        connectOrCreate: {
          where: { name },
          create: {
            name,
            slug: `${slugify(name)}-${randomUUID().slice(0, 6)}`,
          },
        },
      },
    },
  };
}

function getSession(response: Response): AuthSession {
  return response.locals.authSession as AuthSession;
}

function parseStoryInput(request: Request, response: Response): StoryInput | null {
  const parsed = storySchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Check the story details and chapter content.",
        details: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    });
    return null;
  }

  return parsed.data;
}

async function syncChapters(
  transaction: Prisma.TransactionClient,
  storyId: string,
  story: StoryInput,
) {
  const existingChapters = await transaction.chapter.findMany({
    where: { storyId },
    select: { id: true, number: true },
  });

  for (const [index, chapter] of story.chapters.entries()) {
    const number = index + 1;
    const existing = existingChapters.find((item) => item.number === number);
    const panels = chapter.panelUrls.map((imageUrl, panelIndex) => ({
      position: panelIndex + 1,
      imageUrl,
      altText: chapter.panelAltTexts[panelIndex] || null,
      caption: chapter.panelCaptions[panelIndex] || null,
    }));
    const chapterData = {
      title: chapter.title,
      summary: chapter.summary || null,
      body: story.format === "Comic" ? null : chapter.body,
    };

    if (existing) {
      await transaction.chapter.update({
        where: { id: existing.id },
        data: {
          ...chapterData,
          panels: {
            deleteMany: {},
            create: panels,
          },
        },
      });
    } else {
      await transaction.chapter.create({
        data: {
          storyId,
          number,
          ...chapterData,
          panels: { create: panels },
        },
      });
    }
  }

  await transaction.chapter.deleteMany({
    where: {
      storyId,
      number: { gt: story.chapters.length },
    },
  });
}

router.use(
  requireAuthenticatedUser,
  requireRoles("CREATOR", "MODERATOR", "ADMIN"),
);

router.get("/", async (_request, response, next) => {
  try {
    const session = getSession(response);
    const stories = await prisma.story.findMany({
      where: { authorId: session.user.id },
      include: storyInclude,
      orderBy: { updatedAt: "desc" },
    });

    response.status(200).json({ stories });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (request, response, next) => {
  try {
    const input = parseStoryInput(request, response);
    if (!input) return;

    const session = getSession(response);
    const slug = `${slugify(input.title)}-${randomUUID().slice(0, 8)}`;

    const created = await prisma.$transaction(async (transaction) => {
      const story = await transaction.story.create({
        data: {
          slug,
          title: input.title,
          synopsis: input.synopsis,
          format: input.format === "Comic" ? "COMIC" : input.format === "Novel" ? "NOVEL" : "SHORT_STORY",
          publicationStatus: input.publicationStatus === "Completed" ? "COMPLETED" : "ONGOING",
          coverImageUrl: input.coverImage || null,
          authorId: session.user.id,
          genres: genreRelation(input.genre),
        },
      });

      await syncChapters(transaction, story.id, input);
      return transaction.story.findFirstOrThrow({
        where: { id: story.id, authorId: session.user.id },
        include: storyInclude,
      });
    });

    response.status(201).json({ story: created });
  } catch (error) {
    next(error);
  }
});

router.get("/analytics", async (_request, response, next) => {
  try {
    const session = getSession(response);
    const publishedStories = await prisma.story.findMany({
      where: {
        authorId: session.user.id,
        status: "PUBLISHED",
        chapters: { some: { isPublished: true } },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        format: true,
        publishedAt: true,
        _count: {
          select: {
            libraryEntries: true,
            readingProgress: {
              where: {
                chapterId: { not: null },
                chapter: { is: { isPublished: true } },
              },
            },
          },
        },
      },
      orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
    });

    const storyIds = publishedStories.map((story) => story.id);
    const progressWhere = {
      storyId: { in: storyIds },
      chapterId: { not: null },
      chapter: { is: { isPublished: true } },
    };
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [followers, trackedReaders, activeReaders] = await prisma.$transaction([
      prisma.creatorFollow.count({
        where: { creatorId: session.user.id },
      }),
      prisma.readingProgress.findMany({
        where: progressWhere,
        select: { userId: true },
        distinct: ["userId"],
      }),
      prisma.readingProgress.findMany({
        where: { ...progressWhere, lastReadAt: { gte: thirtyDaysAgo } },
        select: { userId: true },
        distinct: ["userId"],
      }),
    ]);

    const stories = publishedStories
      .map((story) => ({
        id: story.id,
        title: story.title,
        slug: story.slug,
        format: story.format,
        publishedAt: story.publishedAt,
        trackedReaders: story._count.readingProgress,
        librarySaves: story._count.libraryEntries,
      }))
      .sort((left, right) =>
        right.trackedReaders - left.trackedReaders ||
        right.librarySaves - left.librarySaves ||
        (right.publishedAt?.getTime() ?? 0) - (left.publishedAt?.getTime() ?? 0),
      );

    response.status(200).json({
      summary: {
        publishedStories: publishedStories.length,
        followers,
        trackedReaderAccounts: trackedReaders.length,
        activeReaderAccountsLast30Days: activeReaders.length,
        librarySaves: stories.reduce((total, story) => total + story.librarySaves, 0),
      },
      stories: stories.slice(0, 10),
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/reviews", async (request, response, next) => {
  try {
    const pagination = z.object({
      page: z.coerce.number().int().min(1).max(1000).default(1),
      limit: z.coerce.number().int().min(1).max(50).default(20),
    }).safeParse(request.query);

    if (!pagination.success) {
      response.status(400).json({
        error: { code: "INVALID_PAGINATION", message: "Page must be positive and limit must be between 1 and 50." },
      });
      return;
    }

    const session = getSession(response);
    const where = { story: { is: { authorId: session.user.id } } };
    const { page, limit } = pagination.data;
    const [reviews, total] = await prisma.$transaction([
      prisma.moderationReview.findMany({
        where,
        select: {
          id: true,
          decision: true,
          note: true,
          createdAt: true,
          reviewer: { select: { id: true, displayName: true } },
          story: {
            select: {
              id: true,
              title: true,
              slug: true,
              format: true,
              status: true,
            },
          },
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.moderationReview.count({ where }),
    ]);

    response.status(200).json({
      reviews,
      pagination: { page, limit, total, hasMore: page * limit < total },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:storyId", async (request, response, next) => {
  try {
    const session = getSession(response);
    const story = await prisma.story.findFirst({
      where: { id: request.params.storyId, authorId: session.user.id },
      include: storyInclude,
    });

    if (!story) {
      response.status(404).json({
        error: { code: "STORY_NOT_FOUND", message: "This story does not exist in your workspace." },
      });
      return;
    }

    response.status(200).json({ story });
  } catch (error) {
    next(error);
  }
});

router.put("/:storyId", async (request, response, next) => {
  try {
    const input = parseStoryInput(request, response);
    if (!input) return;

    const session = getSession(response);
    const current = await prisma.story.findFirst({
      where: { id: request.params.storyId, authorId: session.user.id },
      select: { id: true, status: true },
    });

    if (!current) {
      response.status(404).json({
        error: { code: "STORY_NOT_FOUND", message: "This story does not exist in your workspace." },
      });
      return;
    }

    if (current.status !== "DRAFT") {
      response.status(409).json({
        error: {
          code: "STORY_LOCKED",
          message: "Only draft stories can be edited. A submitted or published story cannot be changed here.",
        },
      });
      return;
    }

    const updated = await prisma.$transaction(async (transaction) => {
      await transaction.story.update({
        where: { id: current.id },
        data: {
          title: input.title,
          synopsis: input.synopsis,
          format: input.format === "Comic" ? "COMIC" : input.format === "Novel" ? "NOVEL" : "SHORT_STORY",
          publicationStatus: input.publicationStatus === "Completed" ? "COMPLETED" : "ONGOING",
          coverImageUrl: input.coverImage || null,
          genres: {
            deleteMany: {},
            ...(genreRelation(input.genre) ?? {}),
          },
        },
      });

      await syncChapters(transaction, current.id, input);
      return transaction.story.findFirstOrThrow({
        where: { id: current.id, authorId: session.user.id },
        include: storyInclude,
      });
    });

    response.status(200).json({ story: updated });
  } catch (error) {
    next(error);
  }
});

router.post("/:storyId/submit", async (request, response, next) => {
  try {
    const session = getSession(response);
    const current = await prisma.story.findFirst({
      where: { id: request.params.storyId, authorId: session.user.id },
      include: {
        genres: true,
        chapters: { include: { panels: true } },
      },
    });

    if (!current) {
      response.status(404).json({
        error: { code: "STORY_NOT_FOUND", message: "This story does not exist in your workspace." },
      });
      return;
    }

    if (current.status !== "DRAFT") {
      response.status(409).json({
        error: { code: "STORY_NOT_DRAFT", message: "Only draft stories can be submitted for review." },
      });
      return;
    }

    const incompleteChapter = current.chapters.find((chapter) =>
      current.format === "COMIC"
        ? chapter.panels.length === 0
        : !chapter.body?.trim(),
    );

    if (
      !current.title.trim() ||
      !current.synopsis.trim() ||
      current.genres.length === 0 ||
      current.chapters.length === 0 ||
      incompleteChapter
    ) {
      response.status(400).json({
        error: {
          code: "SUBMISSION_INCOMPLETE",
          message: "Add a title, synopsis, genre and at least one complete chapter before submitting.",
        },
      });
      return;
    }

    const updated = await prisma.story.update({
      where: { id: current.id },
      data: { status: "IN_REVIEW" },
      include: storyInclude,
    });

    response.status(200).json({ story: updated });
  } catch (error) {
    next(error);
  }
});

export default router;
