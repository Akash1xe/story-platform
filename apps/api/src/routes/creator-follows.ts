import { Router, type Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/database.js";
import { requireAuthenticatedUser, type AuthSession } from "../middleware/auth.js";

const router = Router();
const published = { status: "PUBLISHED" as const, chapters: { some: { isPublished: true } } };
const userId = (response: Response) => (response.locals.authSession as AuthSession).user.id;
router.use(requireAuthenticatedUser);

router.get("/", async (_req, res, next) => {
  try {
    const records = await prisma.creatorFollow.findMany({
      where: { followerId: userId(res) },
      include: { creator: { select: {
        id: true, displayName: true, avatarUrl: true, creatorHandle: true, creatorBio: true,
        stories: { where: published, select: { id: true, slug: true, title: true, coverImageUrl: true }, orderBy: { publishedAt: "desc" }, take: 3 },
        _count: { select: { creatorFollowers: true } },
      } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ following: records.map(({ createdAt, creator }) => ({
      followedAt: createdAt, creator: { ...creator, followersCount: creator._count.creatorFollowers },
    })) });
  } catch (error) { next(error); }
});

router.get("/:creatorId", async (req, res, next) => {
  try {
    const parsed = z.string().trim().min(1).max(100).safeParse(req.params.creatorId);
    if (!parsed.success) { res.status(400).json({ error: { message: "A valid creator ID is required." } }); return; }
    const creator = await prisma.user.findFirst({
      where: { OR: [{ id: parsed.data }, { creatorHandle: parsed.data }], stories: { some: published } },
      select: { id: true },
    });
    if (!creator) { res.status(404).json({ error: { message: "This creator is not available to follow." } }); return; }
    const record = await prisma.creatorFollow.findUnique({
      where: { followerId_creatorId: { followerId: userId(res), creatorId: creator.id } },
      select: { id: true },
    });
    res.json({ following: Boolean(record) });
  } catch (error) { next(error); }
});

router.post("/:creatorId", async (req, res, next) => {
  try {
    const parsed = z.string().trim().min(1).max(100).safeParse(req.params.creatorId);
    if (!parsed.success) { res.status(400).json({ error: { message: "A valid creator ID is required." } }); return; }
    const followerId = userId(res);
    const creator = await prisma.user.findFirst({
      where: { OR: [{ id: parsed.data }, { creatorHandle: parsed.data }], stories: { some: published } },
      select: { id: true },
    });
    if (!creator) { res.status(404).json({ error: { message: "Only creators with published stories can be followed." } }); return; }
    if (creator.id === followerId) { res.status(400).json({ error: { message: "You cannot follow your own profile." } }); return; }
    await prisma.creatorFollow.upsert({
      where: { followerId_creatorId: { followerId, creatorId: creator.id } },
      create: { followerId, creatorId: creator.id }, update: {},
    });
    res.json({ following: true, followersCount: await prisma.creatorFollow.count({ where: { creatorId: creator.id } }) });
  } catch (error) { next(error); }
});

router.delete("/:creatorId", async (req, res, next) => {
  try {
    const parsed = z.string().trim().min(1).max(100).safeParse(req.params.creatorId);
    if (!parsed.success) { res.status(400).json({ error: { message: "A valid creator ID is required." } }); return; }
    const creator = await prisma.user.findFirst({ where: { OR: [{ id: parsed.data }, { creatorHandle: parsed.data }] }, select: { id: true } });
    if (!creator) { res.json({ following: false, followersCount: 0 }); return; }
    await prisma.creatorFollow.deleteMany({ where: { followerId: userId(res), creatorId: creator.id } });
    res.json({ following: false, followersCount: await prisma.creatorFollow.count({ where: { creatorId: creator.id } }) });
  } catch (error) { next(error); }
});

export default router;
