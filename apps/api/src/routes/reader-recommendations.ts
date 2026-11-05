import { Router, type Response } from "express";
import { prisma } from "../lib/database.js";
import { requireAuthenticatedUser, type AuthSession } from "../middleware/auth.js";

const router = Router();
const publishedStoryWhere = {
  status: "PUBLISHED" as const,
  chapters: { some: { isPublished: true } },
};
const signalStorySelect = {
  id: true,
  genres: {
    select: {
      genre: { select: { id: true, name: true } },
    },
  },
} as const;
const catalogInclude = {
  author: { select: { id: true, displayName: true, creatorHandle: true } },
  genres: { include: { genre: { select: { name: true, slug: true } } } },
  chapters: {
    where: { isPublished: true },
    select: { id: true, number: true, title: true },
    orderBy: { number: "asc" as const },
  },
  _count: { select: { chapters: { where: { isPublished: true } } } },
};

function currentUserId(response: Response) {
  return (response.locals.authSession as AuthSession).user.id;
}

router.get("/", requireAuthenticatedUser, async (_request, response, next) => {
  try {
    const userId = currentUserId(response);
    const [savedEntries, progressEntries, ratingEntries] = await Promise.all([
      prisma.libraryEntry.findMany({
        where: { userId, story: publishedStoryWhere },
        select: { story: { select: signalStorySelect } },
        orderBy: { savedAt: "desc" },
        take: 50,
      }),
      prisma.readingProgress.findMany({
        where: {
          userId,
          story: publishedStoryWhere,
          chapterId: { not: null },
          chapter: { is: { isPublished: true } },
        },
        select: { story: { select: signalStorySelect } },
        orderBy: { lastReadAt: "desc" },
        take: 50,
      }),
      prisma.storyRating.findMany({
        where: { userId, story: publishedStoryWhere },
        select: { value: true, story: { select: signalStorySelect } },
        orderBy: { updatedAt: "desc" },
        take: 50,
      }),
    ]);

    const seenStoryIds = new Set<string>();
    const genreScores = new Map<string, { name: string; score: number }>();

    function addGenreSignals(
      story: { id: string; genres: Array<{ genre: { id: string; name: string } }> },
      weight: number,
    ) {
      seenStoryIds.add(story.id);
      for (const { genre } of story.genres) {
        const current = genreScores.get(genre.id);
        genreScores.set(genre.id, {
          name: genre.name,
          score: (current?.score ?? 0) + weight,
        });
      }
    }

    for (const entry of savedEntries) addGenreSignals(entry.story, 2);
    for (const entry of progressEntries) addGenreSignals(entry.story, 3);
    for (const entry of ratingEntries) {
      seenStoryIds.add(entry.story.id);
      if (entry.value >= 4) addGenreSignals(entry.story, 2);
      else if (entry.value === 3) addGenreSignals(entry.story, 1);
    }

    const interestedGenreIds = [...genreScores.keys()];
    const excludedIds = [...seenStoryIds];
    let candidates = await prisma.story.findMany({
      where: {
        ...publishedStoryWhere,
        id: { notIn: excludedIds },
        ...(interestedGenreIds.length
          ? { genres: { some: { genreId: { in: interestedGenreIds } } } }
          : {}),
      },
      include: catalogInclude,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 60,
    });

    // Keep the recommendations useful even when the reader's interests are
    // concentrated in a small catalog: fill remaining slots with fresh work.
    if (candidates.length < 12) {
      const candidateIds = candidates.map((story) => story.id);
      const fallbackStories = await prisma.story.findMany({
        where: {
          ...publishedStoryWhere,
          id: { notIn: [...excludedIds, ...candidateIds] },
        },
        include: catalogInclude,
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        take: 40,
      });
      candidates = [...candidates, ...fallbackStories];
    }

    if (candidates.length === 0) {
      response.status(200).json({ recommendations: [] });
      return;
    }

    const ratingRows = await prisma.storyRating.groupBy({
      by: ["storyId"],
      where: { storyId: { in: candidates.map((story) => story.id) } },
      _avg: { value: true },
      _count: { _all: true },
    });
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

    const ranked = candidates
      .map((story) => {
        const matchingGenres = story.genres
          .map(({ genre }) => ({
            name: genre.name,
            score: genreScores.get(genre.id)?.score ?? 0,
          }))
          .filter((genre) => genre.score > 0)
          .sort((a, b) => b.score - a.score);
        const ratingSummary = ratingsByStoryId.get(story.id) ?? {
          averageRating: null,
          ratingCount: 0,
        };
        return {
          story,
          matchingGenreScore: matchingGenres.reduce((total, genre) => total + genre.score, 0),
          bestMatchingGenre: matchingGenres[0]?.name ?? null,
          ratingSummary,
        };
      })
      .sort((a, b) => {
        if (b.matchingGenreScore !== a.matchingGenreScore) {
          return b.matchingGenreScore - a.matchingGenreScore;
        }
        if ((b.ratingSummary.averageRating ?? 0) !== (a.ratingSummary.averageRating ?? 0)) {
          return (b.ratingSummary.averageRating ?? 0) - (a.ratingSummary.averageRating ?? 0);
        }
        return (b.story.publishedAt?.getTime() ?? b.story.createdAt.getTime())
          - (a.story.publishedAt?.getTime() ?? a.story.createdAt.getTime());
      });

    response.status(200).json({
      recommendations: ranked.slice(0, 12).map((item) => ({
        story: {
          ...item.story,
          ratingSummary: item.ratingSummary,
        },
        reason: item.bestMatchingGenre
          ? `Because you enjoy ${item.bestMatchingGenre}`
          : "Recently published",
      })),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
