"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { BookMarked, Check, ChevronDown, Plus, X } from "lucide-react";

type ReadingListSummary = {
  id: string;
  name: string;
  entries?: Array<{ story: { slug: string } }>;
};
type ReadingListsResponse = { lists: ReadingListSummary[] };

async function readError(response: Response, fallback: string) {
  const payload = await response.json().catch(() => null) as
    | { error?: { message?: string } }
    | null;
  return payload?.error?.message ?? fallback;
}

export default function AddToReadingListButton({ storySlug }: { storySlug: string }) {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [lists, setLists] = useState<ReadingListSummary[]>([]);
  const [selectedListId, setSelectedListId] = useState("");
  const [listName, setListName] = useState("");
  const [description, setDescription] = useState("");
  const [creatingNew, setCreatingNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (sessionPending) return;
    setIsOpen(false);
    setLists([]);
    setSelectedListId("");
    setLoaded(false);
    setError("");
    setNotice("");
  }, [sessionPending, session?.user?.id]);

  async function openPanel() {
    if (sessionPending || saving) return;
    if (!session?.user) {
      router.push(`/sign-in?next=${encodeURIComponent(`/stories/${storySlug}`)}`);
      return;
    }
    setIsOpen(true);
    setError("");
    setNotice("");
    if (loaded) return;

    setLoading(true);
    try {
      const response = await fetch("/api/v1/reading-lists", {
        credentials: "include",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error(await readError(response, "Your reading lists could not be loaded."));
      const payload = await response.json() as ReadingListsResponse;
      const available = payload.lists.filter((list) =>
        !list.entries?.some((entry) => entry.story.slug === storySlug)
      );
      setLists(payload.lists);
      setSelectedListId(available[0]?.id ?? "");
      setCreatingNew(available.length === 0);
      setLoaded(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Your reading lists could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  async function addStoryToList(listId: string) {
    const response = await fetch(
      `/api/v1/reading-lists/${encodeURIComponent(listId)}/stories/${encodeURIComponent(storySlug)}`,
      {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
      },
    );
    if (!response.ok) throw new Error(await readError(response, "This story could not be added to your list."));
  }

  async function addToSelectedList() {
    if (!selectedListId || saving) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await addStoryToList(selectedListId);
      const selected = lists.find((list) => list.id === selectedListId);
      setLists((current) => current.map((list) =>
        list.id === selectedListId
          ? { ...list, entries: [...(list.entries ?? []), { story: { slug: storySlug } }] }
          : list
      ));
      const nextAvailable = lists.find((list) =>
        list.id !== selectedListId
        && !list.entries?.some((entry) => entry.story.slug === storySlug)
      );
      setSelectedListId(nextAvailable?.id ?? "");
      setNotice(`Added to ${selected?.name ?? "your reading list"}.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "This story could not be added.");
    } finally {
      setSaving(false);
    }
  }

  async function createListAndAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || listName.trim().length < 2) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/v1/reading-lists", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ name: listName, description }),
      });
      if (!response.ok) throw new Error(await readError(response, "The reading list could not be created."));
      const payload = await response.json() as { list: ReadingListSummary };
      setLists((current) => [{ ...payload.list, entries: [] }, ...current]);
      setSelectedListId(payload.list.id);
      setListName("");
      setDescription("");
      setCreatingNew(false);

      await addStoryToList(payload.list.id);
      setLists((current) => current.map((list) =>
        list.id === payload.list.id
          ? { ...list, entries: [{ story: { slug: storySlug } }] }
          : list
      ));
      setSelectedListId("");
      setNotice(`Created ${payload.list.name} and added this story.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The list could not be created.");
    } finally {
      setSaving(false);
    }
  }

  const availableLists = lists.filter((list) =>
    !list.entries?.some((entry) => entry.story.slug === storySlug)
  );

  return (
    <div className="add-to-reading-list">
      <button
        type="button"
        className="button-secondary add-to-reading-list-trigger"
        onClick={() => isOpen ? setIsOpen(false) : void openPanel()}
        aria-expanded={isOpen}
        aria-controls="add-to-reading-list-panel"
        disabled={sessionPending || saving}
      >
        <BookMarked size={15} />
        Add to reading list
        <ChevronDown size={14} className={isOpen ? "is-rotated" : ""} />
      </button>

      {isOpen && (
        <div className="add-to-reading-list-panel" id="add-to-reading-list-panel">
          <div className="add-to-reading-list-heading">
            <div><strong>Save this story to a list</strong><span>Only you can see your reading lists.</span></div>
            <button type="button" className="add-to-reading-list-close" onClick={() => setIsOpen(false)} aria-label="Close reading list panel">
              <X size={15} />
            </button>
          </div>
          {loading ? (
            <p className="add-to-reading-list-message" role="status">Loading your lists…</p>
          ) : !loaded ? (
            <p className="add-to-reading-list-message" role="status">Your reading lists could not be loaded. Close this panel and open it again to retry.</p>
          ) : (
            <>
              {lists.length > 0 && (
                <div className="add-to-reading-list-mode">
                  <button type="button" className={!creatingNew ? "is-active" : ""} onClick={() => setCreatingNew(false)}>
                    Existing list
                  </button>
                  <button type="button" className={creatingNew ? "is-active" : ""} onClick={() => setCreatingNew(true)}>
                    <Plus size={12} /> New list
                  </button>
                </div>
              )}
              {!creatingNew && availableLists.length > 0 ? (
                <div className="add-to-reading-list-form">
                  <label htmlFor="story-reading-list-select">Choose a list</label>
                  <select id="story-reading-list-select" value={selectedListId}
                    onChange={(event) => setSelectedListId(event.target.value)} disabled={saving}>
                    {availableLists.map((list) => <option key={list.id} value={list.id}>{list.name}</option>)}
                  </select>
                  <button type="button" onClick={() => void addToSelectedList()} disabled={saving || !selectedListId}>
                    {saving ? "Adding…" : "Add story"}
                  </button>
                </div>
              ) : !creatingNew ? (
                <div className="add-to-reading-list-message">
                  <Check size={15} />
                  <span>This story is already in all your reading lists.</span>
                  <button type="button" onClick={() => setCreatingNew(true)}>Create another list</button>
                </div>
              ) : (
                <form className="add-to-reading-list-create" onSubmit={createListAndAdd}>
                  <label>
                    <span>List name</span>
                    <input value={listName} onChange={(event) => setListName(event.target.value)}
                      minLength={2} maxLength={40} required placeholder="e.g. To read next" disabled={saving} />
                  </label>
                  <label>
                    <span>Description <small>Optional</small></span>
                    <input value={description} onChange={(event) => setDescription(event.target.value)}
                      maxLength={160} placeholder="A short description" disabled={saving} />
                  </label>
                  <button type="submit" disabled={saving || listName.trim().length < 2}>
                    {saving ? "Creating…" : "Create list & add story"}
                  </button>
                </form>
              )}
            </>
          )}
          {error && <p className="add-to-reading-list-feedback is-error" role="alert">{error}</p>}
          {notice && <p className="add-to-reading-list-feedback" role="status">{notice}</p>}
        </div>
      )}
    </div>
  );
}
