import { Router, type Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/database.js";
import { requireAuthenticatedUser, type AuthSession } from "../middleware/auth.js";

const router = Router();
const publishedStoryWhere = { status: "PUBLISHED" as const, chapters: { some: { isPublished: true } } };
const storyInclude = {
  author: { select: { id: true, displayName: true } },
  genres: { include: { genre: { select: { name: true, slug: true } } } },
  chapters: { where: { isPublished: true }, select: { id: true, number: true, title: true }, orderBy: { number: "asc" as const } },
  _count: { select: { chapters: { where: { isPublished: true } } } },
};
function userId(response: Response): string {
  return (response.locals.authSession as AuthSession).user.id;
}
router.use(requireAuthenticatedUser);

router.get("/library", async (_request, response, next) => {
  try {
    const entries = await prisma.libraryEntry.findMany({
      where: { userId: userId(response), story: publishedStoryWhere },
      include: { story: { include: storyInclude } },
      orderBy: { savedAt: "desc" },
    });
    response.status(200).json({ savedStories: entries.map((entry) => ({ savedAt: entry.savedAt, story: entry.story })) });
  } catch (error) { next(error); }
});

router.post("/library/:storySlug", async (request, response, next) => {
  try {
    const parsedSlug = z.string().min(1).max(100).safeParse(request.params.storySlug);
    if (!parsedSlug.success) {
      response.status(400).json({ error: { code: "INVALID_STORY", message: "A valid story slug is required." } });
      return;
    }
    const story = await prisma.story.findFirst({
      where: { slug: parsedSlug.data, ...publishedStoryWhere },
      select: { id: true },
    });
    if (!story) {
      response.status(404).json({ error: { code: "STORY_NOT_FOUND", message: "Only published stories can be saved." } });
      return;
    }
    const id = userId(response);
    const entry = await prisma.libraryEntry.upsert({
      where: { userId_storyId: { userId: id, storyId: story.id } },
      create: { userId: id, storyId: story.id },
      update: {},
      select: { id: true, savedAt: true },
    });
    response.status(200).json({ saved: true, entry });
  } catch (error) { next(error); }
});

router.delete("/library/:storySlug", async (request, response, next) => {
  try {
    const story = await prisma.story.findFirst({ where: { slug: request.params.storySlug }, select: { id: true } });
    if (story) {
      await prisma.libraryEntry.deleteMany({ where: { userId: userId(response), storyId: story.id } });
    }
    response.status(200).json({ saved: false });
  } catch (error) { next(error); }
});

router.get("/reading-progress", async (_request, response, next) => {
  try {
    const records = await prisma.readingProgress.findMany({
      where: {
        userId: userId(response),
        story: publishedStoryWhere,
        chapterId: { not: null },
        chapter: { is: { isPublished: true } },
      },
      include: {
        story: { include: storyInclude },
        chapter: { select: { id: true, number: true, title: true } },
      },
      orderBy: { lastReadAt: "desc" },
    });
    response.status(200).json({
      progress: records.map((record) => ({
        progressRatio: record.progressRatio,
        lastReadAt: record.lastReadAt,
        story: record.story,
        chapter: record.chapter,
      })),
    });
  } catch (error) { next(error); }
});

router.get("/reading-progress/:chapterId", async (request, response, next) => {
  try {
    const progress = await prisma.readingProgress.findFirst({
      where: {
        userId: userId(response),
        chapterId: request.params.chapterId,
        story: publishedStoryWhere,
        chapter: { is: { isPublished: true } },
      },
      select: { progressRatio: true, lastReadAt: true, chapterId: true },
    });
    response.status(200).json({ progress });
  } catch (error) { next(error); }
});

const progressSchema = z.object({ progressRatio: z.number().min(0).max(1) });
router.put("/reading-progress/:chapterId", async (request, response, next) => {
  try {
    const parsed = progressSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({ error: { code: "INVALID_PROGRESS", message: "Progress must be a number between 0 and 1." } });
      return;
    }
    const chapter = await prisma.chapter.findFirst({
      where: { id: request.params.chapterId, isPublished: true, story: publishedStoryWhere },
      select: { id: true, storyId: true },
    });
    if (!chapter) {
      response.status(404).json({ error: { code: "CHAPTER_NOT_FOUND", message: "Progress can only be saved for a published chapter." } });
      return;
    }
    const id = userId(response);
    const progress = await prisma.readingProgress.upsert({
      where: { userId_storyId: { userId: id, storyId: chapter.storyId } },
      create: { userId: id, storyId: chapter.storyId, chapterId: chapter.id, progressRatio: parsed.data.progressRatio },
      update: { chapterId: chapter.id, progressRatio: parsed.data.progressRatio, lastReadAt: new Date() },
      select: { progressRatio: true, lastReadAt: true, chapterId: true },
    });
    response.status(200).json({ progress });
  } catch (error) { next(error); }
});
export default router;
