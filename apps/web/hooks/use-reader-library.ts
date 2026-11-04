"use client";
import { useCallback, useEffect, useState } from "react";
import {
  LIBRARY_CHANGE_EVENT,
  readReaderLibrary,
  writeReaderLibrary,
  type ReaderLibraryData
} from "@/lib/reader-library";

const EMPTY_LIBRARY: ReaderLibraryData = { savedStoryIds: [], progress: {} };

export function useReaderLibrary() {
  const [library, setLibrary] = useState<ReaderLibraryData>(EMPTY_LIBRARY);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const syncLibrary = () => {
      setLibrary(readReaderLibrary());
      setIsReady(true);
    };
    syncLibrary();
    window.addEventListener(LIBRARY_CHANGE_EVENT, syncLibrary);
    window.addEventListener("storage", syncLibrary);
    return () => {
      window.removeEventListener(LIBRARY_CHANGE_EVENT, syncLibrary);
      window.removeEventListener("storage", syncLibrary);
    };
  }, []);

  const toggleSavedStory = useCallback((storyId: string) => {
    const current = readReaderLibrary();
    const isSaved = current.savedStoryIds.includes(storyId);
    const next: ReaderLibraryData = {
      ...current,
      savedStoryIds: isSaved
        ? current.savedStoryIds.filter((id) => id !== storyId)
        : [...current.savedStoryIds, storyId]
    };
    writeReaderLibrary(next);
    setLibrary(next);
  }, []);

  const recordReadingProgress = useCallback((storyId: string, percent: number) => {
    const normalized = Math.min(100, Math.max(0, Math.round(percent)));
    const current = readReaderLibrary();
    if (current.progress[storyId]?.percent === normalized) return;
    const next: ReaderLibraryData = {
      ...current,
      progress: {
        ...current.progress,
        [storyId]: { percent: normalized, updatedAt: Date.now() }
      }
    };
    writeReaderLibrary(next);
    setLibrary(next);
  }, []);

  return { library, isReady, toggleSavedStory, recordReadingProgress };
}
