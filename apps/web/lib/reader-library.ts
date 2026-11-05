import type { Story } from "@/lib/demo-content";
import type { PublicStorySummary } from "@/lib/public-stories";
import { toCatalogStory } from "@/lib/public-stories";

export type LibraryProgressRecord = {
  story: Story;
  chapterId: string;
  chapterNumber: number;
  chapterTitle: string;
  percent: number;
  updatedAt: number;
};
export type ReaderLibraryData = {
  savedStoryIds: string[];
  savedStories: Story[];
  continueReading: LibraryProgressRecord[];
};
type LibraryResponse = { savedStories: Array<{ savedAt: string; story: PublicStorySummary }> };
type ProgressResponse = {
  progress: Array<{
    progressRatio: number;
    lastReadAt: string;
    story: PublicStorySummary;
    chapter: { id: string; number: number; title: string } | null;
  }>;
};
export const EMPTY_READER_LIBRARY: ReaderLibraryData = { savedStoryIds: [], savedStories: [], continueReading: [] };

export async function fetchReaderLibrary(): Promise<ReaderLibraryData> {
  const [libraryResponse, progressResponse] = await Promise.all([
    fetch("/api/v1/library", { credentials: "include", cache: "no-store" }),
    fetch("/api/v1/reading-progress", { credentials: "include", cache: "no-store" }),
  ]);
  if (libraryResponse.status === 401 || progressResponse.status === 401) throw new Error("Sign in to view your account library.");
  if (!libraryResponse.ok || !progressResponse.ok) throw new Error("Your library could not be loaded. Please try again.");
  const library = await libraryResponse.json() as LibraryResponse;
  const progress = await progressResponse.json() as ProgressResponse;
  const savedStories = library.savedStories.map((entry) => toCatalogStory(entry.story));
  return {
    savedStoryIds: savedStories.map((story) => story.id),
    savedStories,
    continueReading: progress.progress.flatMap((record) => record.chapter ? [{
      story: toCatalogStory(record.story),
      chapterId: record.chapter.id,
      chapterNumber: record.chapter.number,
      chapterTitle: record.chapter.title,
      percent: Math.round(record.progressRatio * 100),
      updatedAt: new Date(record.lastReadAt).getTime(),
    }] : []),
  };
}
