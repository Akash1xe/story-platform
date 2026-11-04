export type CreatorFormat = "Comic" | "Novel" | "Short story";
export type CreatorReviewStatus = "Draft" | "In review" | "Approved" | "Changes requested";

export type CreatorChapter = {
  id: string;
  title: string;
  body: string;
  panelUrls: string[];
  updatedAt: number;
};

export type CreatorStory = {
  id: string;
  title: string;
  synopsis: string;
  genre: string;
  format: CreatorFormat;
  publicationStatus: "Ongoing" | "Completed";
  coverImage: string;
  reviewStatus: CreatorReviewStatus;
  reviewNote: string;
  chapters: CreatorChapter[];
  createdAt: number;
  updatedAt: number;
};

const STORAGE_KEY = "storyworld:creator-stories:v1";

export function readCreatorStories(): CreatorStory[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is CreatorStory => {
      return Boolean(
        item &&
        typeof item === "object" &&
        typeof item.id === "string" &&
        typeof item.title === "string" &&
        Array.isArray(item.chapters)
      );
    });
  } catch {
    return [];
  }
}

export function writeCreatorStories(stories: CreatorStory[]): boolean {
  if (typeof window === "undefined") return false;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
    return true;
  } catch {
    return false;
  }
}

export function formatCreatorDate(timestamp: number): string {
  if (!timestamp) return "Not saved yet";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(timestamp);
}
