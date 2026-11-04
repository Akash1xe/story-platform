import type {
  CreatorChapter,
  CreatorFormat,
  CreatorReviewStatus,
  CreatorStory,
} from "@/lib/creator-content";

type ApiPanel = {
  id: string;
  position: number;
  imageUrl: string;
};

type ApiChapter = {
  id: string;
  number: number;
  title: string;
  body: string | null;
  updatedAt: string;
  panels: ApiPanel[];
};

type ApiStory = {
  id: string;
  slug: string;
  title: string;
  synopsis: string;
  format: "COMIC" | "NOVEL" | "SHORT_STORY";
  status: "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "ARCHIVED";
  publicationStatus: "ONGOING" | "COMPLETED";
  coverImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  genres: Array<{ genre: { name: string } }>;
  chapters: ApiChapter[];
  moderationReviews: Array<{ decision: string; note: string | null }>;
};

export type StoryDraftInput = {
  title: string;
  synopsis: string;
  genre: string;
  format: CreatorFormat;
  publicationStatus: "Ongoing" | "Completed";
  coverImage: string;
  chapters: Array<Pick<CreatorChapter, "title" | "body" | "panelUrls">>;
};

const STORIES_ENDPOINT = "/api/v1/creator/stories";

function toCreatorFormat(format: ApiStory["format"]): CreatorFormat {
  if (format === "NOVEL") return "Novel";
  if (format === "SHORT_STORY") return "Short story";
  return "Comic";
}

function toReviewStatus(status: ApiStory["status"]): CreatorReviewStatus {
  if (status === "IN_REVIEW") return "In review";
  if (status === "PUBLISHED" || status === "ARCHIVED") return "Approved";
  return "Draft";
}

function toTimestamp(value: string): number {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Date.now() : parsed;
}

function fromApiStory(story: ApiStory): CreatorStory {
  return {
    id: story.id,
    title: story.title,
    synopsis: story.synopsis,
    genre: story.genres[0]?.genre.name ?? "",
    format: toCreatorFormat(story.format),
    publicationStatus: story.publicationStatus === "COMPLETED" ? "Completed" : "Ongoing",
    coverImage: story.coverImageUrl ?? "",
    reviewStatus: toReviewStatus(story.status),
    reviewNote: story.moderationReviews[0]?.note ?? "",
    chapters: story.chapters.map((chapter) => ({
      id: chapter.id,
      title: chapter.title,
      body: chapter.body ?? "",
      panelUrls: chapter.panels
        .slice()
        .sort((left, right) => left.position - right.position)
        .map((panel) => panel.imageUrl),
      updatedAt: toTimestamp(chapter.updatedAt),
    })),
    createdAt: toTimestamp(story.createdAt),
    updatedAt: toTimestamp(story.updatedAt),
  };
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(path, {
      ...init,
      credentials: "include",
      cache: "no-store",
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new Error("Could not reach the StoryWorld API. Check that the API server is running.");
  }

  const payload = (await response.json().catch(() => null)) as
    | { error?: { message?: string }; stories?: ApiStory[]; story?: ApiStory }
    | null;

  if (!response.ok) {
    throw new Error(
      payload?.error?.message ??
        (response.status === 401
          ? "Your session has expired. Sign in again."
          : "The story could not be saved. Please try again."),
    );
  }

  return payload as T;
}

export async function listCreatorStories(): Promise<CreatorStory[]> {
  const payload = await requestJson<{ stories: ApiStory[] }>(STORIES_ENDPOINT);
  return payload.stories.map(fromApiStory);
}

export async function getCreatorStory(storyId: string): Promise<CreatorStory> {
  const payload = await requestJson<{ story: ApiStory }>(
    `${STORIES_ENDPOINT}/${encodeURIComponent(storyId)}`,
  );
  return fromApiStory(payload.story);
}

export async function saveCreatorStory(
  storyId: string | undefined,
  input: StoryDraftInput,
): Promise<CreatorStory> {
  const response = await requestJson<{ story: ApiStory }>(
    storyId ? `${STORIES_ENDPOINT}/${encodeURIComponent(storyId)}` : STORIES_ENDPOINT,
    {
      method: storyId ? "PUT" : "POST",
      body: JSON.stringify(input),
    },
  );

  return fromApiStory(response.story);
}

export async function submitCreatorStory(storyId: string): Promise<CreatorStory> {
  const response = await requestJson<{ story: ApiStory }>(
    `${STORIES_ENDPOINT}/${encodeURIComponent(storyId)}/submit`,
    { method: "POST" },
  );

  return fromApiStory(response.story);
}
