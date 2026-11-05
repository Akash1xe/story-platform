"use client";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { EMPTY_READER_LIBRARY, fetchReaderLibrary, type ReaderLibraryData } from "@/lib/reader-library";

type ReaderLibraryContextValue = {
  library: ReaderLibraryData;
  isReady: boolean;
  isAuthenticated: boolean;
  isSaving: boolean;
  error: string;
  toggleSavedStory: (storyId: string) => Promise<void>;
  refresh: () => Promise<void>;
};
const ReaderLibraryContext = createContext<ReaderLibraryContextValue | null>(null);

export function ReaderLibraryProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const [library, setLibrary] = useState<ReaderLibraryData>(EMPTY_READER_LIBRARY);
  const [isReady, setIsReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!session) { setLibrary(EMPTY_READER_LIBRARY); setIsReady(true); return; }
    setError("");
    try { setLibrary(await fetchReaderLibrary()); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Your library could not be loaded."); }
    finally { setIsReady(true); }
  }, [session]);

  useEffect(() => {
    if (isSessionPending) return;
    let active = true;
    setIsReady(false);
    if (!session) { setLibrary(EMPTY_READER_LIBRARY); setIsReady(true); return; }
    fetchReaderLibrary()
      .then((value) => { if (active) { setLibrary(value); setError(""); } })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Your library could not be loaded."); })
      .finally(() => { if (active) setIsReady(true); });
    return () => { active = false; };
  }, [isSessionPending, session]);

  const toggleSavedStory = useCallback(async (storyId: string) => {
    if (!session) { router.push(`/sign-in?next=${encodeURIComponent("/library")}`); return; }
    const isSaved = library.savedStoryIds.includes(storyId);
    setIsSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/v1/library/${encodeURIComponent(storyId)}`, {
        method: isSaved ? "DELETE" : "POST", credentials: "include",
      });
      if (response.status === 401) { router.push(`/sign-in?next=${encodeURIComponent("/library")}`); return; }
      if (!response.ok) throw new Error("This story could not be updated in your library.");
      await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "This story could not be updated."); }
    finally { setIsSaving(false); }
  }, [library.savedStoryIds, refresh, router, session]);

  return (
    <ReaderLibraryContext.Provider value={{ library, isReady: isReady && !isSessionPending, isAuthenticated: Boolean(session), isSaving, error, toggleSavedStory, refresh }}>
      {children}
    </ReaderLibraryContext.Provider>
  );
}

export function useReaderLibrary() {
  const context = useContext(ReaderLibraryContext);
  if (!context) throw new Error("useReaderLibrary must be used inside ReaderLibraryProvider.");
  return context;
}
