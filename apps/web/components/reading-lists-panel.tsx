"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { BookMarked, Plus, Trash2, X } from "lucide-react";
import type { Story } from "@/lib/demo-content";
import { useReaderLibrary } from "@/hooks/use-reader-library";

type ReadingListEntry = {
  id: string;
  addedAt: string;
  story: {
    id: string;
    slug: string;
    title: string;
    synopsis: string;
    coverImageUrl: string | null;
    author: { id: string; displayName: string };
    format: "COMIC" | "NOVEL" | "SHORT_STORY";
    genres: Array<{ genre: { name: string; slug: string } }>;
    chapters: Array<{ id: string; number: number; title: string }>;
    publicationStatus: "ONGOING" | "COMPLETED";
  };
};
type ReadingList = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  entries: ReadingListEntry[];
};

async function responseError(response: Response, fallback: string) {
  const payload = await response.json().catch(() => null) as
    | { error?: { message?: string } }
    | null;
  return payload?.error?.message ?? fallback;
}

export default function ReadingListsPanel() {
  const { library } = useReaderLibrary();
  const [lists, setLists] = useState<ReadingList[]>([]);
  const [selectedListId, setSelectedListId] = useState("");
  const [listName, setListName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedStorySlug, setSelectedStorySlug] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    const response = await fetch("/api/v1/reading-lists", {
      credentials: "include",
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(await responseError(response, "Your reading lists could not be loaded."));
    const payload = await response.json() as { lists: ReadingList[] };
    setLists(payload.lists);
    setSelectedListId((current) =>
      current && payload.lists.some((list) => list.id === current)
        ? current
        : payload.lists[0]?.id ?? ""
    );
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    refresh()
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Your reading lists could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [refresh]);

  const selectedList = lists.find((list) => list.id === selectedListId) ?? null;
  const availableStories = useMemo(
    () => library.savedStories.filter((story) =>
      !selectedList?.entries.some((entry) => entry.story.slug === story.id)
    ),
    [library.savedStories, selectedList],
  );

  async function createList(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
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
      if (!response.ok) throw new Error(await responseError(response, "The reading list could not be created."));
      const payload = await response.json() as { list: ReadingList };
      setSelectedListId(payload.list.id);
      setListName("");
      setDescription("");
      await refresh();
      setSelectedListId(payload.list.id);
      setNotice("Reading list created.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The reading list could not be created.");
    } finally {
      setSaving(false);
    }
  }

  async function addStory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedList || !selectedStorySlug || saving) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(
        `/api/v1/reading-lists/${encodeURIComponent(selectedList.id)}/stories/${encodeURIComponent(selectedStorySlug)}`,
        { method: "POST", credentials: "include", headers: { Accept: "application/json" } },
      );
      if (!response.ok) throw new Error(await responseError(response, "The story could not be added to this list."));
      await refresh();
      setSelectedStorySlug("");
      setNotice("Story added to your list.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The story could not be added.");
    } finally {
      setSaving(false);
    }
  }

  async function removeStory(storySlug: string) {
    if (!selectedList || saving) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(
        `/api/v1/reading-lists/${encodeURIComponent(selectedList.id)}/stories/${encodeURIComponent(storySlug)}`,
        { method: "DELETE", credentials: "include", headers: { Accept: "application/json" } },
      );
      if (!response.ok) throw new Error(await responseError(response, "The story could not be removed."));
      await refresh();
      setNotice("Story removed from your list.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The story could not be removed.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteList() {
    if (!selectedList || saving) return;
    if (!window.confirm(`Delete "${selectedList.name}"? The stories will remain in your library.`)) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/v1/reading-lists/${encodeURIComponent(selectedList.id)}`, {
        method: "DELETE",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error(await responseError(response, "The reading list could not be deleted."));
      await refresh();
      setNotice("Reading list deleted. Saved stories remain in your library.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The reading list could not be deleted.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="reading-lists-panel" aria-labelledby="reading-lists-title">
      <div className="reading-lists-heading">
        <div>
          <span className="eyebrow">MAKE YOUR OWN COLLECTIONS</span>
          <h2 id="reading-lists-title">Reading lists</h2>
          <p>Organize saved stories by mood, genre or what you want to read next.</p>
        </div>
        <span className="reading-lists-icon"><BookMarked size={22} /></span>
      </div>
      <form className="reading-list-create" onSubmit={createList}>
        <label>
          <span>List name</span>
          <input value={listName} onChange={(event) => setListName(event.target.value)}
            minLength={2} maxLength={40} required placeholder="e.g. Weekend reading" disabled={saving} />
        </label>
        <label>
          <span>Description <small>Optional</small></span>
          <input value={description} onChange={(event) => setDescription(event.target.value)}
            maxLength={160} placeholder="What belongs in this collection?" disabled={saving} />
        </label>
        <button className="reading-list-create-button" type="submit" disabled={saving || listName.trim().length < 2}>
          <Plus size={15} /> Create list
        </button>
      </form>
      {error && <p className="reading-list-feedback is-error" role="alert">{error}</p>}
      {notice && <p className="reading-list-feedback" role="status">{notice}</p>}
      {loading ? (
        <p className="reading-list-empty" role="status">Loading your reading lists…</p>
      ) : lists.length === 0 ? (
        <div className="reading-list-empty">
          <BookMarked size={21} />
          <div><strong>No reading lists yet</strong><p>Create a list above, then add stories from your saved library.</p></div>
        </div>
      ) : (
        <div className="reading-list-workspace">
          <div className="reading-list-tabs" aria-label="Your reading lists">
            {lists.map((list) => (
              <button key={list.id} type="button"
                className={selectedListId === list.id ? "reading-list-tab is-active" : "reading-list-tab"}
                onClick={() => { setSelectedListId(list.id); setSelectedStorySlug(""); }}
                aria-pressed={selectedListId === list.id}>
                <span>{list.name}</span><small>{list.entries.length}</small>
              </button>
            ))}
          </div>
          {selectedList && (
            <div className="reading-list-content">
              <div className="reading-list-detail-heading">
                <div><h3>{selectedList.name}</h3><p>{selectedList.description || "A personal collection of stories."}</p></div>
                <button type="button" className="reading-list-delete" onClick={() => void deleteList()} disabled={saving}>
                  <Trash2 size={14} /> Delete list
                </button>
              </div>
              {availableStories.length > 0 ? (
                <form className="reading-list-add" onSubmit={addStory}>
                  <label htmlFor="reading-list-story-select">Add from saved stories</label>
                  <select id="reading-list-story-select" value={selectedStorySlug}
                    onChange={(event) => setSelectedStorySlug(event.target.value)} disabled={saving}>
                    <option value="">Choose a saved story…</option>
                    {availableStories.map((story: Story) => <option key={story.id} value={story.id}>{story.title}</option>)}
                  </select>
                  <button type="submit" disabled={saving || !selectedStorySlug}>Add story</button>
                </form>
              ) : (
                <p className="reading-list-hint">All your saved stories are already in this list, or save more from Discover.</p>
              )}
              {selectedList.entries.length ? (
                <div className="reading-list-entries">
                  {selectedList.entries.map((entry) => (
                    <article className="reading-list-entry" key={entry.id}>
                      <Link className="reading-list-cover" href={`/stories/${entry.story.slug}`}
                        style={{ backgroundImage: entry.story.coverImageUrl ? `url("${entry.story.coverImageUrl}")` : "none" }}
                        aria-label={`Open ${entry.story.title}`} />
                      <div className="reading-list-entry-copy">
                        <Link href={`/stories/${entry.story.slug}`}>{entry.story.title}</Link>
                        <span>by {entry.story.author.displayName}</span>
                      </div>
                      <button type="button" className="reading-list-remove" onClick={() => void removeStory(entry.story.slug)}
                        disabled={saving} aria-label={`Remove ${entry.story.title} from ${selectedList.name}`}>
                        <X size={15} />
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="reading-list-empty reading-list-empty--inside">
                  <BookMarked size={20} />
                  <div><strong>This list is empty</strong><p>Add a saved story using the selector above.</p></div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
