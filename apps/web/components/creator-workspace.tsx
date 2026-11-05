"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  BookOpen,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  Layers3,
  NotebookPen,
  Plus,
  Save,
  Send,
  Sparkles,
  Trash2
} from "lucide-react";
import {
  formatCreatorDate,
  type CreatorChapter,
  type CreatorFormat,
  type CreatorReviewStatus,
  type CreatorStory
} from "@/lib/creator-content";
import {
  getCreatorStory,
  listCreatorStories,
  saveCreatorStory,
  submitCreatorStory
} from "@/lib/creator-api";
import { genres } from "@/lib/demo-content";
import { SiteHeader } from "@/components/site-header";
import { AuthNav } from "@/components/auth-nav";
import { useUnsavedChangesWarning } from "@/hooks/use-unsaved-changes-warning";
import editorStatusStyles from "./creator-editor-status.module.css";

type CreatorWorkspaceProps = {
  storyId?: string;
};

const FORMAT_OPTIONS: CreatorFormat[] = ["Comic", "Novel", "Short story"];

type DraftSnapshotInput = Pick<
  CreatorStory,
  "title" | "synopsis" | "genre" | "format" | "publicationStatus" | "coverImage" | "chapters"
>;

function createDraftSnapshot(story: DraftSnapshotInput): string {
  return JSON.stringify({
    title: story.title.trim(),
    synopsis: story.synopsis.trim(),
    genre: story.genre,
    format: story.format,
    publicationStatus: story.publicationStatus,
    coverImage: story.coverImage.trim(),
    chapters: story.chapters.map((chapter) => ({
      title: chapter.title,
      summary: chapter.summary ?? "",
      body: chapter.body,
      panelUrls: chapter.panelUrls,
      panelAltTexts: chapter.panelAltTexts ?? [],
      panelCaptions: chapter.panelCaptions ?? [],
    })),
  });
}

function makeId(): string {
  return window.crypto?.randomUUID?.() ?? ("story-" + Date.now() + "-" + Math.random().toString(36).slice(2));
}

function statusClass(status: CreatorReviewStatus): string {
  if (status === "Approved") return "creator-status creator-status--approved";
  if (status === "In review") return "creator-status creator-status--review";
  if (status === "Changes requested") return "creator-status creator-status--changes";
  return "creator-status";
}

export function CreatorStudio() {
  const [stories, setStories] = useState<CreatorStory[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;

    listCreatorStories()
      .then((items) => {
        if (active) setStories(items);
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(error instanceof Error ? error.message : "Could not load your stories.");
        }
      })
      .finally(() => {
        if (active) setIsReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => ({
    drafts: stories.filter((story) => story.reviewStatus === "Draft" || story.reviewStatus === "Changes requested").length,
    review: stories.filter((story) => story.reviewStatus === "In review").length,
    approved: stories.filter((story) => story.reviewStatus === "Approved").length
  }), [stories]);

  return (
    <>
      <CreatorHeader active="studio" />
      <main className="creator-shell">
        <section className="creator-welcome">
          <div>
            <span className="eyebrow"><Sparkles size={13} /> CREATOR WORKSPACE</span>
            <h1>Your stories deserve <span>a world of their own.</span></h1>
            <p>Build a series, write chapters, arrange comic panels and prepare your work for review.</p>
          </div>
          <div className="creator-welcome-art" aria-hidden="true">
            <NotebookPen size={37} />
            <span>CREATE<br />SOMETHING<br />WORTH READING</span>
          </div>
        </section>

        <div className="creator-local-note">
          <CheckCircle2 size={15} />
          <div><strong>Account-backed workspace</strong><span>Your stories and chapters are saved to your StoryWorld account and can be opened from another device. Image uploads and moderator decisions are being added separately.</span></div>
        </div>

        <section className="creator-stats" aria-label="Creator dashboard summary">
          <div><span className="creator-stat-icon"><FileText size={17} /></span><strong>{isReady ? stats.drafts : "—"}</strong><span>Drafts</span></div>
          <div><span className="creator-stat-icon"><Clock3 size={17} /></span><strong>{isReady ? stats.review : "—"}</strong><span>In review</span></div>
          <div><span className="creator-stat-icon"><CheckCircle2 size={17} /></span><strong>{isReady ? stats.approved : "—"}</strong><span>Approved</span></div>
        </section>

        <section className="creator-list-section">
          <div className="creator-list-heading">
            <div><span className="eyebrow">YOUR WORKS</span><h2>Stories and series</h2><p>Keep building from where you left off.</p></div>
            <Link className="button-primary" href="/creator/new"><Plus size={15} /> Create a story</Link>
          </div>

          {!isReady ? (
            <div className="creator-empty"><span className="creator-empty-icon"><Layers3 size={25} /></span><h3>Loading your workspace</h3></div>
          ) : loadError ? (
            <div className="creator-empty"><AlertCircle size={24} /><h3>Could not load your stories</h3><p>{loadError}</p></div>
          ) : stories.length ? (
            <div className="creator-work-list">
              {stories.slice().sort((a, b) => b.updatedAt - a.updatedAt).map((story) => (
                <article className="creator-work-card" key={story.id}>
                  <div className="creator-work-cover" style={story.coverImage ? { backgroundImage: "url(" + JSON.stringify(story.coverImage) + ")" } : undefined}>
                    {!story.coverImage && <BookOpen size={23} />}
                    <span>{story.format}</span>
                  </div>
                  <div className="creator-work-copy">
                    <div className="creator-work-title-row"><h3>{story.title || "Untitled story"}</h3><span className={statusClass(story.reviewStatus)}>{story.reviewStatus}</span></div>
                    <p>{story.synopsis || "No synopsis added yet."}</p>
                    <div className="creator-work-meta"><span>{story.genre || "Genre not set"}</span><span>{story.chapters.length} {story.chapters.length === 1 ? "chapter" : "chapters"}</span><span>Updated {formatCreatorDate(story.updatedAt)}</span></div>
                    {story.reviewNote && <p className="creator-review-note">Review note: {story.reviewNote}</p>}
                  </div>
                  <Link className="creator-work-action" href={"/creator/" + story.id} aria-label={"Edit " + (story.title || "story")}><span>{story.reviewStatus === "Approved" ? "View" : "Open editor"}</span><ArrowRight size={16} /></Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="creator-empty">
              <span className="creator-empty-icon"><NotebookPen size={27} /></span>
              <h3>Your first story starts here</h3>
              <p>Create a comic, write a novel or publish a standalone short story. Your work stays a draft until you submit it for review.</p>
              <Link className="button-primary" href="/creator/new"><Plus size={15} /> Create your first story</Link>
            </div>
          )}
        </section>

        <section className="creator-guidance">
          <div><span className="eyebrow">THE PUBLISHING FLOW</span><h2>From first draft to reader-ready</h2></div>
          <div className="creator-guidance-steps">
            <div><span>01</span><strong>Create</strong><p>Set up your story, format, genre and synopsis.</p></div>
            <div><span>02</span><strong>Build</strong><p>Add prose chapters or comic panel image URLs.</p></div>
            <div><span>03</span><strong>Submit</strong><p>Send a complete draft into the review queue.</p></div>
          </div>
        </section>
      </main>
    </>
  );
}

export function CreatorEditor({ storyId }: CreatorWorkspaceProps) {
  const router = useRouter();
  const [stories, setStories] = useState<CreatorStory[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [genre, setGenre] = useState("");
  const [format, setFormat] = useState<CreatorFormat>("Comic");
  const [publicationStatus, setPublicationStatus] = useState<"Ongoing" | "Completed">("Ongoing");
  const [coverImage, setCoverImage] = useState("");
  const [chapters, setChapters] = useState<CreatorChapter[]>([]);
  const [chapterTitle, setChapterTitle] = useState("");
  const [chapterSummary, setChapterSummary] = useState("");
  const [chapterBody, setChapterBody] = useState("");
  const [panelUrlsText, setPanelUrlsText] = useState("");
  const [panelAltTextsText, setPanelAltTextsText] = useState("");
  const [panelCaptionsText, setPanelCaptionsText] = useState("");
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savedStoryId, setSavedStoryId] = useState(storyId ?? "");
  const savedDraftSnapshotRef = useRef<string | null>(null);

  const draftSnapshot = createDraftSnapshot({
    title,
    synopsis,
    genre,
    format,
    publicationStatus,
    coverImage,
    chapters,
  });
  const chapterBeingEdited = editingChapterId
    ? chapters.find((chapter) => chapter.id === editingChapterId)
    : undefined;
  const isChapterEditorDirty = editingChapterId
    ? !chapterBeingEdited ||
      chapterTitle !== chapterBeingEdited.title ||
      chapterSummary !== (chapterBeingEdited.summary ?? "") ||
      chapterBody !== chapterBeingEdited.body ||
      panelUrlsText !== chapterBeingEdited.panelUrls.join("\n") ||
      panelAltTextsText !== (chapterBeingEdited.panelAltTexts ?? []).join("\n") ||
      panelCaptionsText !== (chapterBeingEdited.panelCaptions ?? []).join("\n")
    : Boolean(
        chapterTitle.trim() ||
        chapterSummary.trim() ||
        chapterBody.trim() ||
        panelUrlsText.trim() ||
        panelAltTextsText.trim() ||
        panelCaptionsText.trim()
      );
  const currentEditorSnapshot = JSON.stringify({
    draftSnapshot,
    editingChapterId,
    chapterTitle,
    chapterSummary,
    chapterBody,
    panelUrlsText,
    panelAltTextsText,
    panelCaptionsText,
  });
  const currentEditorSnapshotRef = useRef(currentEditorSnapshot);
  currentEditorSnapshotRef.current = currentEditorSnapshot;
  const hasUnsavedChanges = savedDraftSnapshotRef.current !== null && (
    draftSnapshot !== savedDraftSnapshotRef.current || isChapterEditorDirty
  );

  useUnsavedChangesWarning(hasUnsavedChanges);

  useEffect(() => {
    let active = true;

    async function loadStory() {
      if (!storyId) {
        savedDraftSnapshotRef.current = createDraftSnapshot({
          title: "",
          synopsis: "",
          genre: "",
          format: "Comic",
          publicationStatus: "Ongoing",
          coverImage: "",
          chapters: [],
        });
        if (active) setIsReady(true);
        return;
      }

      try {
        const existing = await getCreatorStory(storyId);
        if (!active) return;
        savedDraftSnapshotRef.current = createDraftSnapshot(existing);
        setStories([existing]);
        setTitle(existing.title);
        setSynopsis(existing.synopsis);
        setGenre(existing.genre);
        setFormat(existing.format);
        setPublicationStatus(existing.publicationStatus);
        setCoverImage(existing.coverImage);
        setChapters(existing.chapters);
        setSavedStoryId(existing.id);
      } catch (loadError) {
        if (active) {
          setLoadError(loadError instanceof Error ? loadError.message : "Could not load this story.");
        }
      } finally {
        if (active) setIsReady(true);
      }
    }

    void loadStory();
    return () => {
      active = false;
    };
  }, [storyId]);

  const existingStory = storyId ? stories.find((story) => story.id === storyId) : undefined;
  const notFound = Boolean(storyId && isReady && !existingStory);
  const isLocked = existingStory?.reviewStatus === "In review" || existingStory?.reviewStatus === "Approved";
  const chapterPreview = chapters.find((chapter) => chapter.id === editingChapterId) ?? chapters[chapters.length - 1];

  function resetChapterForm() {
    setChapterTitle("");
    setChapterSummary("");
    setChapterBody("");
    setPanelUrlsText("");
    setPanelAltTextsText("");
    setPanelCaptionsText("");
    setEditingChapterId(null);
    setPreviewOpen(false);
  }

  function addOrUpdateChapter() {
    setError("");
    if (!chapterTitle.trim()) {
      setError("Add a chapter or episode title before saving it.");
      return;
    }
    if (format !== "Comic" && !chapterBody.trim()) {
      setError("Add some chapter text before saving it.");
      return;
    }
    const altTextLines = panelAltTextsText.split(/\r?\n/);
    const captionLines = panelCaptionsText.split(/\r?\n/);
    const panels = panelUrlsText.split(/\r?\n/).map((url, index) => ({
      url: url.trim(),
      altText: altTextLines[index]?.trim() ?? "",
      caption: captionLines[index]?.trim() ?? "",
    })).filter((panel) => panel.url.length > 0);
    const panelUrls = panels.map((panel) => panel.url);
    if (format === "Comic" && panelUrls.length === 0) {
      setError("Add at least one panel image URL for this comic episode.");
      return;
    }
    if (format === "Comic" && panelUrls.some((url) => !/^https?:\/\//i.test(url))) {
      setError("Panel images must use public HTTP or HTTPS URLs.");
      return;
    }
    if (format === "Comic" && panels.some((panel) => panel.altText.length > 500 || panel.caption.length > 500)) {
      setError("Panel alt text and captions must each be 500 characters or fewer.");
      return;
    }

    const existingChapter = editingChapterId
      ? chapters.find((item) => item.id === editingChapterId)
      : undefined;
    const timestamp = Date.now();
    const chapter: CreatorChapter = {
      id: editingChapterId ?? makeId(),
      serverChapterId: existingChapter?.serverChapterId,
      title: chapterTitle.trim(),
      summary: chapterSummary.trim(),
      body: chapterBody.trim(),
      panelUrls,
      panelAltTexts: panels.map((panel) => panel.altText),
      panelCaptions: panels.map((panel) => panel.caption),
      updatedAt: timestamp
    };
    setChapters((current) => {
      if (editingChapterId) return current.map((item) => item.id === editingChapterId ? chapter : item);
      return [...current, chapter];
    });
    resetChapterForm();
    setNotice("Chapter saved to this draft. Save the story to keep all changes.");
  }

  function editChapter(chapter: CreatorChapter) {
    setEditingChapterId(chapter.id);
    setChapterTitle(chapter.title);
    setChapterSummary(chapter.summary ?? "");
    setChapterBody(chapter.body);
    setPanelUrlsText(chapter.panelUrls.join("\n"));
    setPanelAltTextsText((chapter.panelAltTexts ?? []).join("\n"));
    setPanelCaptionsText((chapter.panelCaptions ?? []).join("\n"));
    setPreviewOpen(false);
    setError("");
  }

  function removeChapter(chapterId: string) {
    setChapters((current) => current.filter((chapter) => chapter.id !== chapterId));
    if (editingChapterId === chapterId) resetChapterForm();
  }

  function moveChapter(index: number, direction: -1 | 1) {
    setChapters((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const reordered = [...current];
      const [chapter] = reordered.splice(index, 1);
      if (!chapter) return current;
      reordered.splice(target, 0, chapter);
      return reordered;
    });
    setError("");
    setNotice("Chapter order changed. Save the draft to apply the new reading order.");
  }

  async function persistStory(nextStatus: CreatorReviewStatus) {
    setError("");
    setNotice("");

    if (isSaving) return;

    if (nextStatus === "In review" && isChapterEditorDirty) {
      setError("Finish or cancel the open chapter edit before submitting the story for review.");
      return;
    }

    if (nextStatus === "In review") {
      if (!title.trim() || !synopsis.trim() || !genre) {
        setError("Add a title, synopsis and genre before submitting for review.");
        return;
      }
      if (chapters.length === 0) {
        setError("Add at least one complete chapter or episode before submitting.");
        return;
      }
      if (format === "Comic" && chapters.some((chapter) => chapter.panelUrls.length === 0 || chapter.panelUrls.some((url) => !/^https?:\/\//i.test(url)))) {
        setError("Every comic episode needs panel images using public HTTP or HTTPS URLs.");
        return;
      }
      if (format !== "Comic" && chapters.some((chapter) => !chapter.body.trim())) {
        setError("Every prose chapter needs body text before submission.");
        return;
      }
    }

    const editorSnapshotAtSaveStart = currentEditorSnapshot;
    const hasOpenChapterEditsAtSaveStart = isChapterEditorDirty;
    const localChapterIdsAtSaveStart = chapters.map((chapter) => chapter.id);

    setIsSaving(true);
    try {
      const saved = await saveCreatorStory(savedStoryId || undefined, {
        title: title.trim(),
        synopsis: synopsis.trim(),
        genre,
        format,
        publicationStatus,
        coverImage: coverImage.trim(),
        chapters: chapters.map((chapter) => ({
          chapterId: chapter.serverChapterId,
          title: chapter.title,
          summary: chapter.summary ?? "",
          body: chapter.body,
          panelUrls: chapter.panelUrls,
          panelAltTexts: chapter.panelAltTexts ?? [],
          panelCaptions: chapter.panelCaptions ?? [],
        })),
      });

      // Keep the database ID immediately so a failed submit can be retried
      // without accidentally creating a second story.
      setSavedStoryId(saved.id);
      savedDraftSnapshotRef.current = createDraftSnapshot(saved);

      // Preserve edits made while the request was in flight, while attaching
      // the server IDs returned for the chapters that were actually saved.
      setChapters((current) => current.map((chapter) => {
        const savedIndex = localChapterIdsAtSaveStart.indexOf(chapter.id);
        const serverChapterId = savedIndex >= 0
          ? saved.chapters[savedIndex]?.serverChapterId
          : undefined;
        return serverChapterId ? { ...chapter, serverChapterId } : chapter;
      }));

      setStories((current) => [
        saved,
        ...current.filter((story) => story.id !== saved.id),
      ]);

      const editorChangedWhileSaving =
        currentEditorSnapshotRef.current !== editorSnapshotAtSaveStart;
      const chapterEditsRemain = hasOpenChapterEditsAtSaveStart || editorChangedWhileSaving;

      if (!storyId && !chapterEditsRemain) {
        router.replace("/creator/" + saved.id);
      }

      if (nextStatus === "In review") {
        if (editorChangedWhileSaving) {
          setNotice("Your draft was saved, but new edits were made while it was saving. Save those changes before submitting.");
          return;
        }

        const result = await submitCreatorStory(saved.id);
        setStories((current) => [
          result,
          ...current.filter((story) => story.id !== result.id),
        ]);
        setNotice("Your story has been submitted. It is now saved in the moderator review queue.");
        return;
      }

      setNotice(
        chapterEditsRemain
          ? "Draft saved. Your open chapter edits or newer changes are still unsaved."
          : "Draft saved to your StoryWorld account.",
      );
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "The story could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  if (!isReady) {
    return <><CreatorHeader active="studio" /><main className="creator-shell"><div className="creator-empty">Loading editor…</div></main></>;
  }

  if (loadError || notFound) {
    return <><CreatorHeader active="studio" /><main className="creator-shell"><div className="creator-empty"><AlertCircle size={25} /><h2>{loadError ? "Could not load this story" : "Story not found"}</h2><p>{loadError || "This story is not available in your account."}</p><Link className="button-primary" href="/creator">Back to Creator Studio</Link></div></main></>;
  }

  if (isLocked && existingStory) {
    return <><CreatorHeader active="studio" /><main className="creator-shell"><div className="creator-breadcrumb"><Link href="/creator"><ArrowLeft size={14} /> Creator Studio</Link></div><div className="creator-locked"><CheckCircle2 size={28} /><span className={statusClass(existingStory.reviewStatus)}>{existingStory.reviewStatus}</span><h1>{existingStory.title}</h1><p>{existingStory.reviewStatus === "Approved" ? "This story has been approved and is no longer editable here." : "This story has been submitted and is read-only while it is being reviewed."}</p><Link className="button-secondary" href="/creator">Back to your stories</Link></div></main></>;
  }

  return (
    <>
      <CreatorHeader active="studio" />
      <main className="creator-shell creator-editor-shell">
        <div className="creator-breadcrumb"><Link href="/creator"><ArrowLeft size={14} /> Creator Studio</Link><span>/</span><span>{storyId ? "Edit story" : "New story"}</span></div>
        <div className="creator-editor-heading">
          <div><span className="eyebrow">STORY BUILDER</span><h1>{storyId ? "Continue your story" : "Create a new story"}</h1><p>Start with the details, then add chapters or episodes to build your reader experience.</p></div>
          <div className={editorStatusStyles.headingStatus}>
            <span className="creator-draft-badge"><FileText size={13} /> {existingStory?.reviewStatus ?? "New draft"}</span>
            {savedDraftSnapshotRef.current !== null && (
              <span
                className={[
                  editorStatusStyles.saveState,
                  hasUnsavedChanges ? editorStatusStyles.unsaved : editorStatusStyles.saved,
                ].join(" ")}
                role="status"
                aria-live="polite"
              >
                {hasUnsavedChanges ? <AlertCircle size={13} /> : <CheckCircle2 size={13} />}
                {hasUnsavedChanges ? "Unsaved changes" : "All changes saved"}
              </span>
            )}
          </div>
        </div>

        <div className="creator-editor-grid" aria-busy={isSaving}>
          <div className="creator-editor-main">
            <section className="creator-form-card">
              <div className="creator-form-heading"><span>01</span><div><h2>Story details</h2><p>Give readers a reason to open your story.</p></div></div>
              <label className="creator-field"><span>Story title <b>*</b></span><input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={90} placeholder="e.g. The City Beyond the Rain" /></label>
              <label className="creator-field"><span>Synopsis <b>*</b></span><textarea value={synopsis} onChange={(event) => setSynopsis(event.target.value)} maxLength={500} rows={4} placeholder="A short, spoiler-free introduction to your story..." /><small>{synopsis.length}/500 characters</small></label>
              <div className="creator-field-row">
                <label className="creator-field"><span>Genre <b>*</b></span><select value={genre} onChange={(event) => setGenre(event.target.value)}><option value="">Choose a genre</option>{genres.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
                <label className="creator-field"><span>Format</span><select value={format} onChange={(event) => { setFormat(event.target.value as CreatorFormat); resetChapterForm(); }}>{FORMAT_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
              </div>
              <div className="creator-field-row">
                <label className="creator-field"><span>Series status</span><select value={publicationStatus} onChange={(event) => setPublicationStatus(event.target.value as "Ongoing" | "Completed")}><option value="Ongoing">Ongoing</option><option value="Completed">Completed</option></select></label>
                <label className="creator-field"><span>Cover image URL <small>(optional)</small></span><input type="url" value={coverImage} onChange={(event) => setCoverImage(event.target.value)} placeholder="https://..." /></label>
              </div>
              {coverImage && <div className="creator-cover-preview" style={{ backgroundImage: "url(" + JSON.stringify(coverImage) + ")" }}><span>Cover preview</span></div>}
              <p className="creator-field-hint">Image uploads are not connected yet. Use a publicly accessible HTTP or HTTPS image URL for now.</p>
            </section>

            <section className="creator-form-card">
              <div className="creator-form-heading"><span>02</span><div><h2>Chapters and episodes</h2><p>{format === "Comic" ? "Add panel images in reading order, one URL per line." : "Write a chapter for your novel or short story."}</p></div></div>
              {chapters.length > 0 && <div className="creator-chapter-list">
                {chapters.map((chapter, index) => (
                  <article className={"creator-chapter-item" + (editingChapterId === chapter.id ? " is-editing" : "")} key={chapter.id}>
                    <span className="creator-chapter-number">{String(index + 1).padStart(2, "0")}</span>
                    <div className="creator-chapter-copy"><strong>{chapter.title}</strong><span>{format === "Comic" ? chapter.panelUrls.length + " panel image URLs" : chapter.body.trim().split(/\s+/).filter(Boolean).length + " words"}</span></div>
                    <button type="button" className="creator-icon-button creator-chapter-order-button" onClick={() => moveChapter(index, -1)} disabled={index === 0} aria-label={"Move " + chapter.title + " up"} title="Move up"><ChevronUp size={15} /></button>
                    <button type="button" className="creator-icon-button creator-chapter-order-button" onClick={() => moveChapter(index, 1)} disabled={index === chapters.length - 1} aria-label={"Move " + chapter.title + " down"} title="Move down"><ChevronDown size={15} /></button>
                    <button type="button" className="creator-icon-button" onClick={() => editChapter(chapter)} aria-label={"Edit " + chapter.title}>Edit</button>
                    <button type="button" className="creator-icon-button creator-icon-button--danger" onClick={() => removeChapter(chapter.id)} aria-label={"Delete " + chapter.title}><Trash2 size={14} /></button>
                  </article>
                ))}
              </div>}
              <div className="creator-chapter-editor">
                <div className="creator-subheading"><h3>{editingChapterId ? "Edit chapter" : "Add a chapter"}</h3><span>{format}</span></div>
                <label className="creator-field"><span>Chapter / episode title <b>*</b></span><input value={chapterTitle} onChange={(event) => setChapterTitle(event.target.value)} placeholder="e.g. Chapter 1 — The Beginning" maxLength={100} /></label>
                <label className="creator-field"><span>Chapter summary <small>(optional)</small></span><textarea value={chapterSummary} onChange={(event) => setChapterSummary(event.target.value)} maxLength={300} rows={3} placeholder="A short, spoiler-free preview of this chapter..." /><small>{chapterSummary.length}/300 characters. Shown in the public chapter list.</small></label>
                {format === "Comic" ? (
                  <>
                    <label className="creator-field"><span>Panel image URLs <b>*</b></span><textarea value={panelUrlsText} onChange={(event) => setPanelUrlsText(event.target.value)} rows={5} placeholder={"https://example.com/panel-01.jpg\nhttps://example.com/panel-02.jpg"} /><small>One public image URL per line. Panels appear in the order listed.</small></label>
                    <label className="creator-field"><span>Panel alt text <small>(optional)</small></span><textarea value={panelAltTextsText} onChange={(event) => setPanelAltTextsText(event.target.value)} rows={4} placeholder={"A wide shot of the city at night.\nThe main character opens the door."} /><small>One description per panel, in the same order as the image URLs. Leave a line empty for a decorative panel.</small></label>
                    <label className="creator-field"><span>Panel captions <small>(optional)</small></span><textarea value={panelCaptionsText} onChange={(event) => setPanelCaptionsText(event.target.value)} rows={3} placeholder={"The city never sleeps.\nA sound breaks the silence."} /><small>One caption per panel, in the same order as the image URLs.</small></label>
                  </>
                ) : (
                  <label className="creator-field"><span>Chapter text <b>*</b></span><textarea className="creator-writing-area" value={chapterBody} onChange={(event) => setChapterBody(event.target.value)} rows={10} placeholder="Write your chapter here..." /><small>{chapterBody.trim() ? chapterBody.trim().split(/\s+/).length : 0} words</small></label>
                )}
                <div className="creator-chapter-actions">
                  <button className="button-primary" type="button" onClick={addOrUpdateChapter}><Plus size={14} /> {editingChapterId ? "Update chapter" : "Add chapter"}</button>
                  {editingChapterId && <button className="button-secondary" type="button" onClick={resetChapterForm}>Cancel edit</button>}
                  <button className="creator-text-button" type="button" onClick={() => setPreviewOpen((current) => !current)}><Eye size={14} /> {previewOpen ? "Hide preview" : "Preview chapter"}</button>
                </div>
                {previewOpen && (
                  <div className="creator-live-preview">
                    <span className="eyebrow">LIVE PREVIEW</span>
                    <h3>{chapterTitle || chapterPreview?.title || "Untitled chapter"}</h3>
                    {chapterSummary.trim() && <p className="creator-preview-summary">{chapterSummary}</p>}
                    {format === "Comic" ? (
                      <div className="creator-preview-panels">{panelUrlsText.split(/\r?\n/).map((url, lineIndex) => ({ url: url.trim(), altText: panelAltTextsText.split(/\r?\n/)[lineIndex]?.trim() ?? "", caption: panelCaptionsText.split(/\r?\n/)[lineIndex]?.trim() ?? "" })).filter((panel) => panel.url).map((panel, index) => <div key={panel.url + index}><img src={panel.url} alt={panel.altText || (panel.caption ? "" : "Comic panel " + (index + 1))} />{panel.caption && <p>{panel.caption}</p>}<span>Panel {index + 1}</span></div>)}</div>
                    ) : <p>{chapterBody || "Your chapter text will appear here as you write."}</p>}
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="creator-editor-aside">
            <div className="creator-aside-card">
              <span className="eyebrow">YOUR CHECKLIST</span>
              <h3>Ready to submit?</h3>
              <ul>
                <li className={title.trim() ? "is-done" : ""}><CheckCircle2 size={15} /> Story title</li>
                <li className={synopsis.trim() ? "is-done" : ""}><CheckCircle2 size={15} /> Synopsis</li>
                <li className={genre ? "is-done" : ""}><CheckCircle2 size={15} /> Genre selected</li>
                <li className={chapters.length ? "is-done" : ""}><CheckCircle2 size={15} /> At least one chapter</li>
                <li className={format !== "Comic" || (chapters.length > 0 && chapters.every((chapter) => chapter.panelUrls.length > 0)) ? "is-done" : ""}><CheckCircle2 size={15} /> Chapter content complete</li>
              </ul>
              <p>Submissions enter a review state. They are not published automatically.</p>
            </div>
            <div className="creator-aside-card creator-aside-card--actions">
              <button className="button-primary creator-wide-button" type="button" onClick={() => void persistStory("Draft")} disabled={isSaving}><Save size={15} /> {isSaving ? "Saving…" : "Save draft"}</button>
              <button className="button-submit creator-wide-button" type="button" onClick={() => void persistStory("In review")} disabled={isSaving}><Send size={15} /> {isSaving ? "Saving…" : "Submit for review"}</button>
              <Link className="creator-cancel-link" href="/creator">Back to Creator Studio</Link>
            </div>
            {notice && <div className="creator-feedback creator-feedback--success" role="status"><CheckCircle2 size={15} />{notice}</div>}
            {error && <div className="creator-feedback creator-feedback--error" role="alert"><AlertCircle size={15} />{error}</div>}
          </aside>
        </div>
      </main>
    </>
  );
}

export function CreatorHeader({ active }: { active: "studio" | "reviews" | "analytics" | "profile" }) {
  return (
    <SiteHeader
      variant="creator"
      active={active}
      actions={
        <>
          <Link href="/creator/new" className="creator-button"><Plus size={14} /> New story</Link>
          <AuthNav />
        </>
      }
    />
  );
}
