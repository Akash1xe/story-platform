import { Router, type Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/database.js";
import { requireAuthenticatedUser, type AuthSession } from "../middleware/auth.js";

const router = Router();
const publishedStoryWhere = {
  status: "PUBLISHED" as const,
  chapters: { some: { isPublished: true } },
};
const storyInclude = {
  author: { select: { id: true, displayName: true, creatorHandle: true } },
  genres: { include: { genre: { select: { name: true, slug: true } } } },
  chapters: {
    where: { isPublished: true },
    select: { id: true, number: true, title: true },
    orderBy: { number: "asc" as const },
  },
  _count: { select: { chapters: { where: { isPublished: true } } } },
};
const createListSchema = z.object({
  name: z.string().trim().min(2).max(40),
  description: z.string().trim().max(160).optional().default(""),
});
const updateListSchema = z.object({
  name: z.string().trim().min(2).max(40).optional(),
  description: z.string().trim().max(160).optional(),
}).refine((value) => value.name !== undefined || value.description !== undefined, {
  message: "Provide a name or description to update.",
});

function userId(response: Response): string {
  return (response.locals.authSession as AuthSession).user.id;
}
function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === "object" && error !== null
    && "code" in error && error.code === "P2002";
}
function sendError(response: Response, status: number, code: string, message: string) {
  response.status(status).json({ error: { code, message } });
}

router.use(requireAuthenticatedUser);

router.get("/", async (_request, response, next) => {
  try {
    const lists = await prisma.readingList.findMany({
      where: { userId: userId(response) },
      include: {
        entries: {
          where: { story: publishedStoryWhere },
          include: { story: { include: storyInclude } },
          orderBy: { addedAt: "desc" },
        },
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    });
    response.status(200).json({ lists });
  } catch (error) { next(error); }
});

router.post("/", async (request, response, next) => {
  try {
    const parsed = createListSchema.safeParse(request.body);
    if (!parsed.success) {
      sendError(response, 400, "INVALID_READING_LIST", "Use a name between 2 and 40 characters and a description up to 160 characters.");
      return;
    }
    const ownerId = userId(response);
    const count = await prisma.readingList.count({ where: { userId: ownerId } });
    if (count >= 50) {
      sendError(response, 409, "READING_LIST_LIMIT", "You can create up to 50 reading lists.");
      return;
    }
    const existing = await prisma.readingList.findFirst({
      where: { userId: ownerId, name: parsed.data.name },
      select: { id: true },
    });
    if (existing) {
      sendError(response, 409, "READING_LIST_EXISTS", "You already have a list with that name.");
      return;
    }
    const list = await prisma.readingList.create({
      data: {
        userId: ownerId,
        name: parsed.data.name,
        description: parsed.data.description || null,
      },
      include: { entries: true },
    });
    response.status(201).json({ list });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      sendError(response, 409, "READING_LIST_EXISTS", "You already have a list with that name.");
      return;
    }
    next(error);
  }
});

router.patch("/:listId", async (request, response, next) => {
  try {
    const parsedId = z.string().trim().min(1).max(100).safeParse(request.params.listId);
    const parsedBody = updateListSchema.safeParse(request.body);
    if (!parsedId.success || !parsedBody.success) {
      sendError(response, 400, "INVALID_READING_LIST", "Provide a valid list ID and at least one valid field.");
      return;
    }
    const ownerId = userId(response);
    const existing = await prisma.readingList.findFirst({
      where: { id: parsedId.data, userId: ownerId },
      select: { id: true },
    });
    if (!existing) {
      sendError(response, 404, "READING_LIST_NOT_FOUND", "This reading list could not be found.");
      return;
    }
    if (parsedBody.data.name) {
      const duplicate = await prisma.readingList.findFirst({
        where: {
          userId: ownerId,
          name: parsedBody.data.name,
          id: { not: parsedId.data },
        },
        select: { id: true },
      });
      if (duplicate) {
        sendError(response, 409, "READING_LIST_EXISTS", "You already have a list with that name.");
        return;
      }
    }
    const list = await prisma.readingList.update({
      where: { id: parsedId.data },
      data: {
        ...(parsedBody.data.name !== undefined ? { name: parsedBody.data.name } : {}),
        ...(parsedBody.data.description !== undefined
          ? { description: parsedBody.data.description || null } : {}),
      },
      include: {
        entries: {
          where: { story: publishedStoryWhere },
          include: { story: { include: storyInclude } },
          orderBy: { addedAt: "desc" },
        },
      },
    });
    response.status(200).json({ list });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      sendError(response, 409, "READING_LIST_EXISTS", "You already have a list with that name.");
      return;
    }
    next(error);
  }
});

router.delete("/:listId", async (request, response, next) => {
  try {
    const parsedId = z.string().trim().min(1).max(100).safeParse(request.params.listId);
    if (!parsedId.success) {
      sendError(response, 400, "INVALID_READING_LIST", "A valid reading list ID is required.");
      return;
    }
    const result = await prisma.readingList.deleteMany({
      where: { id: parsedId.data, userId: userId(response) },
    });
    if (result.count === 0) {
      sendError(response, 404, "READING_LIST_NOT_FOUND", "This reading list could not be found.");
      return;
    }
    response.status(200).json({ deleted: true });
  } catch (error) { next(error); }
});

router.post("/:listId/stories/:storySlug", async (request, response, next) => {
  try {
    const parsedId = z.string().trim().min(1).max(100).safeParse(request.params.listId);
    const parsedSlug = z.string().trim().min(1).max(100).safeParse(request.params.storySlug);
    if (!parsedId.success || !parsedSlug.success) {
      sendError(response, 400, "INVALID_READING_LIST_ENTRY", "A valid list and story are required.");
      return;
    }
    const ownerId = userId(response);
    const list = await prisma.readingList.findFirst({
      where: { id: parsedId.data, userId: ownerId },
      select: { id: true },
    });
    if (!list) {
      sendError(response, 404, "READING_LIST_NOT_FOUND", "This reading list could not be found.");
      return;
    }
    const story = await prisma.story.findFirst({
      where: { slug: parsedSlug.data, ...publishedStoryWhere },
      select: { id: true },
    });
    if (!story) {
      sendError(response, 404, "STORY_NOT_FOUND", "Only published stories can be added to a reading list.");
      return;
    }
    const entry = await prisma.readingListEntry.upsert({
      where: { listId_storyId: { listId: list.id, storyId: story.id } },
      create: { listId: list.id, storyId: story.id },
      update: {},
      select: { id: true, addedAt: true },
    });
    await prisma.readingList.update({ where: { id: list.id }, data: { updatedAt: new Date() } });
    response.status(200).json({ added: true, entry });
  } catch (error) { next(error); }
});

router.delete("/:listId/stories/:storySlug", async (request, response, next) => {
  try {
    const parsedId = z.string().trim().min(1).max(100).safeParse(request.params.listId);
    const parsedSlug = z.string().trim().min(1).max(100).safeParse(request.params.storySlug);
    if (!parsedId.success || !parsedSlug.success) {
      sendError(response, 400, "INVALID_READING_LIST_ENTRY", "A valid list and story are required.");
      return;
    }
    const ownerId = userId(response);
    const list = await prisma.readingList.findFirst({
      where: { id: parsedId.data, userId: ownerId },
      select: { id: true },
    });
    if (!list) {
      sendError(response, 404, "READING_LIST_NOT_FOUND", "This reading list could not be found.");
      return;
    }
    const story = await prisma.story.findFirst({
      where: { slug: parsedSlug.data },
      select: { id: true },
    });
    if (story) {
      await prisma.readingListEntry.deleteMany({ where: { listId: list.id, storyId: story.id } });
    }
    await prisma.readingList.update({ where: { id: list.id }, data: { updatedAt: new Date() } });
    response.status(200).json({ removed: true });
  } catch (error) { next(error); }
});

export default router;
