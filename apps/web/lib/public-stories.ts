import type { Story, StoryType } from "@/lib/demo-content";

export type PublicStorySummary = {
  id: string;
  slug: string;
  title: string;
  synopsis: string;
  format: "COMIC" | "NOVEL" | "SHORT_STORY";
  publicationStatus: "ONGOING" | "COMPLETED";
  coverImageUrl: string | null;
  publishedAt: string | null;
  author: { id: string; displayName: string; creatorHandle: string | null };
  genres: Array<{ genre: { name: string; slug: string } }>;
  chapters: Array<{ id: string; number: number; title: string }>;
  _count?: { chapters: number };
  ratingSummary?: {
    averageRating: number | null;
    ratingCount: number;
  };
};

export type PublicStoryDetail = PublicStorySummary & {
  chapters: Array<{
    id: string;
    number: number;
    title: string;
    summary: string | null;
    createdAt: string;
    updatedAt: string;
    _count: { panels: number };
  }>;
};

export type PublicCreatorProfile = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  handle: string | null;
  bio: string | null;
  websiteUrl: string | null;
  joinedAt: string;
  followersCount: number;
  stories: PublicStorySummary[];
};

export type PublicChapter = {
  id: string;
  number: number;
  title: string;
  summary: string | null;
  body: string | null;
  panels: Array<{
    id: string;
    position: number;
    imageUrl: string;
    altText: string | null;
    caption: string | null;
  }>;
};

export type PublicStoryPageData = {
  story: { id: string; slug: string; title: string; format: "COMIC" | "NOVEL" | "SHORT_STORY" };
  chapter: PublicChapter;
};

export type CatalogFilters = {
  q?: string;
  genre?: string;
  format?: "COMIC" | "NOVEL" | "SHORT_STORY";
  status?: "ONGOING" | "COMPLETED";
  sort?: "newest" | "oldest" | "title";
  page?: number;
  limit?: number;
};

function apiOrigin() {
  return (process.env.API_SERVER_URL ?? "http://localhost:4000").replace(/\/$/, "");
}

async function fetchApi<T>(path: string): Promise<T> {
  const response = await fetch(`${apiOrigin()}${path}`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    if (response.status === 404) return null as T;
    throw new Error(`Story API request failed (${response.status}).`);
  }
  return response.json() as Promise<T>;
}

export async function listPublicStories(filters: CatalogFilters = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const query = params.toString();
  return fetchApi<{
    stories: PublicStorySummary[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
    genres: string[];
  }>(`/api/v1/stories${query ? `?${query}` : ""}`);
}

export async function getPublicStory(slug: string) {
  return fetchApi<{ story: PublicStoryDetail }>(
    `/api/v1/stories/${encodeURIComponent(slug)}`,
  );
}

export async function getPublicCreator(creatorId: string) {
  return fetchApi<{ creator: PublicCreatorProfile }>(
    `/api/v1/creators/${encodeURIComponent(creatorId)}`,
  );
}

export async function getPublicChapter(slug: string, chapterNumber: number) {
  return fetchApi<PublicStoryPageData>(
    `/api/v1/stories/${encodeURIComponent(slug)}/chapters/${chapterNumber}`,
  );
}

function formatType(format: PublicStorySummary["format"]): StoryType {
  if (format === "NOVEL") return "Novel";
  if (format === "SHORT_STORY") return "Short story";
  return "Comic";
}

export function toCatalogStory(story: PublicStorySummary): Story {
  return {
    id: story.slug,
    creatorId: story.author.creatorHandle ?? story.author.id,
    isPublished: true,
    title: story.title,
    creator: story.author.displayName,
    genre: story.genres[0]?.genre.name ?? "Uncategorised",
    type: formatType(story.format),
    minutes: Math.max(1, story.chapters.length * 4),
    coverImage: story.coverImageUrl ?? "",
    description: story.synopsis,
    status: story.publicationStatus === "COMPLETED" ? "Completed" : "Ongoing",
    averageRating: story.ratingSummary?.averageRating ?? null,
    ratingCount: story.ratingSummary?.ratingCount ?? 0,
    previewTitle: story.chapters[0]?.title ?? "First chapter",
    previewParagraphs: [],
  };
}
