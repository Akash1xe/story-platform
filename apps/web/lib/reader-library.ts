"use client";
export type StoryProgress = { percent: number; updatedAt: number };
export type ReaderLibraryData = { savedStoryIds: string[]; progress: Record<string, StoryProgress> };
const STORAGE_KEY = "storyworld.reader-library.v1";
export const LIBRARY_CHANGE_EVENT = "storyworld:library-change";
const emptyLibrary = (): ReaderLibraryData => ({ savedStoryIds: [], progress: {} });

export function readReaderLibrary(): ReaderLibraryData {
  if (typeof window === "undefined") return emptyLibrary();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyLibrary();
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return emptyLibrary();
    const candidate = parsed as Partial<ReaderLibraryData>;
    const savedStoryIds = Array.isArray(candidate.savedStoryIds)
      ? candidate.savedStoryIds.filter((id): id is string => typeof id === "string")
      : [];
    const progress: ReaderLibraryData["progress"] = {};
    if (candidate.progress && typeof candidate.progress === "object" && !Array.isArray(candidate.progress)) {
      for (const [storyId, value] of Object.entries(candidate.progress)) {
        if (value && typeof value === "object" && typeof value.percent === "number" && Number.isFinite(value.percent)) {
          progress[storyId] = {
            percent: Math.min(100, Math.max(0, Math.round(value.percent))),
            updatedAt: typeof value.updatedAt === "number" && Number.isFinite(value.updatedAt) ? value.updatedAt : 0
          };
        }
      }
    }
    return { savedStoryIds: [...new Set(savedStoryIds)], progress };
  } catch {
    return emptyLibrary();
  }
}

export function writeReaderLibrary(data: ReaderLibraryData): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event(LIBRARY_CHANGE_EVENT));
  } catch {
    // Keep reading usable when browser storage is unavailable or full.
  }
}
