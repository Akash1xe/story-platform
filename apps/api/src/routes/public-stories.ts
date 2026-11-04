import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/database.js";

const router = Router();

const listQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  genre: z.string().trim().max(50).optional(),
  format: z.enum(["COMIC", "NOVEL", "SHORT_STORY"]).optional(),
  status: z.enum(["ONGOING", "COMPLETED"]).optional(),
  sort: z.enum(["newest", "oldest", "title"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(40).default(24),
});

const publishedStoryWhere = {
  status: "PUBLISHED" as const,
  chapters: { some: { isPublished: true } },
};

const catalogInclude = {
  author: { select: { id: true, displayName: true } },
  genres: { include: { genre: { select: { name: true, slug: true } } } },
  chapters: {
    where: { isPublished: true },
    select: { id: true, number: true, title: true },
    orderBy: { number: "asc" as const },
  },
  _count: { select: { chapters: { where: { isPublished: true } } } },
};

router.get("/", async (request, response, next) => {
  try {
    const parsed = listQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      response.status(400).json({
        error: {
          code: "INVALID_STORY_FILTER",
          message: "Check the search, format, status, sort and pagination filters.",
        },
      });
      return;
    }

    const { q, genre, format, status, sort, page, limit } = parsed.data;
    const where = {
      ...publishedStoryWhere,
      ...(format ? { format } : {}),
      ...(status ? { publicationStatus: status } : {}),
      ...(genre ? { genres: { some: { genre: { name: { equals: genre, mode: "insensitive" as const } } } } } : {}),
      ...(q ? {
        OR: [
          { title: { contains: q, mode: "insensitive" as const } },
          { synopsis: { contains: q, mode: "insensitive" as const } },
          { author: { displayName: { contains: q, mode: "insensitive" as const } } },
          { genres: { some: { genre: { name: { contains: q, mode: "insensitive" as const } } } } },
        ],
      } : {}),
    };

    const orderBy =
      sort === "oldest"
        ? [{ publishedAt: "asc" as const }, { createdAt: "asc" as const }]
        : sort === "title"
          ? [{ title: "asc" as const }]
          : [{ publishedAt: "desc" as const }, { createdAt: "desc" as const }];

    const [stories, total, genreRows] = await prisma.$transaction([
      prisma.story.findMany({
        where,
        include: catalogInclude,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.story.count({ where }),
      prisma.genre.findMany({
        where: { stories: { some: { story: publishedStoryWhere } } },
        select: { name: true },
        orderBy: { name: "asc" },
      }),
    ]);

    response.status(200).json({
      stories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      genres: genreRows.map((item) => item.name),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:slug", async (request, response, next) => {
  try {
    const story = await prisma.story.findFirst({
      where: {
        slug: request.params.slug,
        ...publishedStoryWhere,
      },
      include: {
        author: { select: { id: true, displayName: true } },
        genres: { include: { genre: { select: { name: true, slug: true } } } },
        chapters: {
          where: { isPublished: true },
          select: {
            id: true,
            number: true,
            title: true,
            summary: true,
            createdAt: true,
            updatedAt: true,
            _count: { select: { panels: true } },
          },
          orderBy: { number: "asc" },
        },
      },
    });

    if (!story) {
      response.status(404).json({
        error: { code: "STORY_NOT_FOUND", message: "This published story could not be found." },
      });
      return;
    }

    response.status(200).json({ story });
  } catch (error) {
    next(error);
  }
});

router.get("/:slug/chapters/:chapterNumber", async (request, response, next) => {
  try {
    const parsedNumber = z.coerce.number().int().min(1).safeParse(request.params.chapterNumber);
    if (!parsedNumber.success) {
      response.status(400).json({
        error: { code: "INVALID_CHAPTER_NUMBER", message: "Chapter number must be a positive integer." },
      });
      return;
    }

    const story = await prisma.story.findFirst({
      where: { slug: request.params.slug, ...publishedStoryWhere },
      select: {
        id: true,
        slug: true,
        title: true,
        format: true,
        chapters: {
          where: { isPublished: true, number: parsedNumber.data },
          select: {
            id: true,
            number: true,
            title: true,
            summary: true,
            body: true,
            panels: {
              select: { id: true, position: true, imageUrl: true, altText: true, caption: true },
              orderBy: { position: "asc" },
            },
          },
          take: 1,
        },
      },
    });

    const chapter = story?.chapters[0];
    if (!story || !chapter) {
      response.status(404).json({
        error: { code: "CHAPTER_NOT_FOUND", message: "This published chapter could not be found." },
      });
      return;
    }

    response.status(200).json({
      story: { id: story.id, slug: story.slug, title: story.title, format: story.format },
      chapter,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
