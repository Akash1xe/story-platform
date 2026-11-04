"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
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
  readCreatorStories,
  writeCreatorStories,
  type CreatorChapter,
  type CreatorFormat,
  type CreatorReviewStatus,
  type CreatorStory
} from "@/lib/creator-content";
import { genres } from "@/lib/demo-content";

type CreatorWorkspaceProps = {
  storyId?: string;
};

const FORMAT_OPTIONS: CreatorFormat[] = ["Comic", "Novel", "Short story"];

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

  useEffect(() => {
    setStories(readCreatorStories());
    setIsReady(true);
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
          <AlertCircle size={15} />
          <div><strong>Prototype workspace</strong><span>Drafts are stored in this browser only. Submissions are marked for review locally; secure accounts, uploads and real admin approval come with the backend.</span><Link className="creator-local-note__admin-link" href="/admin/reviews">Open local admin review preview →</Link></div>
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
  const [chapterBody, setChapterBody] = useState("");
  const [panelUrlsText, setPanelUrlsText] = useState("");
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [savedStoryId, setSavedStoryId] = useState(storyId ?? "");

  useEffect(() => {
    const existingStories = readCreatorStories();
    setStories(existingStories);
    if (storyId) {
      const existing = existingStories.find((story) => story.id === storyId);
      if (existing) {
        setTitle(existing.title);
        setSynopsis(existing.synopsis);
        setGenre(existing.genre);
        setFormat(existing.format);
        setPublicationStatus(existing.publicationStatus);
        setCoverImage(existing.coverImage);
        setChapters(existing.chapters);
        setSavedStoryId(existing.id);
      }
    }
    setIsReady(true);
  }, [storyId]);

  const existingStory = storyId ? stories.find((story) => story.id === storyId) : undefined;
  const notFound = Boolean(storyId && isReady && !existingStory);
  const isLocked = existingStory?.reviewStatus === "In review" || existingStory?.reviewStatus === "Approved";
  const chapterPreview = chapters.find((chapter) => chapter.id === editingChapterId) ?? chapters[chapters.length - 1];

  function resetChapterForm() {
    setChapterTitle("");
    setChapterBody("");
    setPanelUrlsText("");
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
    const panelUrls = panelUrlsText.split(/\r?\n/).map((url) => url.trim()).filter(Boolean);
    if (format === "Comic" && panelUrls.length === 0) {
      setError("Add at least one panel image URL for this comic episode.");
      return;
    }
    if (format === "Comic" && panelUrls.some((url) => !/^https?:\/\//i.test(url))) {
      setError("Panel images must use public HTTP or HTTPS URLs.");
      return;
    }

    const timestamp = Date.now();
    const chapter: CreatorChapter = {
      id: editingChapterId ?? makeId(),
      title: chapterTitle.trim(),
      body: chapterBody.trim(),
      panelUrls,
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
    setChapterBody(chapter.body);
    setPanelUrlsText(chapter.panelUrls.join("\n"));
    setPreviewOpen(false);
    setError("");
  }

  function removeChapter(chapterId: string) {
    setChapters((current) => current.filter((chapter) => chapter.id !== chapterId));
    if (editingChapterId === chapterId) resetChapterForm();
  }

  function persistStory(nextStatus: CreatorReviewStatus) {
    setError("");
    setNotice("");
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
    }

    const timestamp = Date.now();
    const id = savedStoryId || makeId();
    const previous = stories.find((story) => story.id === id);
    const nextStory: CreatorStory = {
      id,
      title: title.trim(),
      synopsis: synopsis.trim(),
      genre,
      format,
      publicationStatus,
      coverImage: coverImage.trim(),
      reviewStatus: nextStatus,
      reviewNote: nextStatus === "Draft" ? "" : (previous?.reviewNote ?? ""),
      chapters,
      createdAt: previous?.createdAt ?? timestamp,
      updatedAt: timestamp
    };
    const nextStories = previous
      ? stories.map((story) => story.id === id ? nextStory : story)
      : [nextStory, ...stories];

    if (!writeCreatorStories(nextStories)) {
      setError("The browser could not save this draft. Storage may be full or disabled.");
      return;
    }

    setStories(nextStories);
    setSavedStoryId(id);
    if (!storyId) router.replace("/creator/" + id);
    setNotice(nextStatus === "In review"
      ? "Your work is marked In review in this browser. Real moderator review is not connected yet."
      : "Draft saved on this device.");
  }

  if (!isReady) {
    return <><CreatorHeader active="studio" /><main className="creator-shell"><div className="creator-empty">Loading editor…</div></main></>;
  }

  if (notFound) {
    return <><CreatorHeader active="studio" /><main className="creator-shell"><div className="creator-empty"><AlertCircle size={25} /><h2>Draft not found</h2><p>This story may have been removed from this browser.</p><Link className="button-primary" href="/creator">Back to Creator Studio</Link></div></main></>;
  }

  if (isLocked && existingStory) {
    return <><CreatorHeader active="studio" /><main className="creator-shell"><div className="creator-breadcrumb"><Link href="/creator"><ArrowLeft size={14} /> Creator Studio</Link></div><div className="creator-locked"><CheckCircle2 size={28} /><span className={statusClass(existingStory.reviewStatus)}>{existingStory.reviewStatus}</span><h1>{existingStory.title}</h1><p>{existingStory.reviewStatus === "Approved" ? "This draft is marked approved in the local prototype." : "This draft has been submitted and is read-only while it is in the review state."}</p><Link className="button-secondary" href="/creator">Back to your stories</Link></div></main></>;
  }

  return (
    <>
      <CreatorHeader active="studio" />
      <main className="creator-shell creator-editor-shell">
        <div className="creator-breadcrumb"><Link href="/creator"><ArrowLeft size={14} /> Creator Studio</Link><span>/</span><span>{storyId ? "Edit story" : "New story"}</span></div>
        <div className="creator-editor-heading">
          <div><span className="eyebrow">STORY BUILDER</span><h1>{storyId ? "Continue your story" : "Create a new story"}</h1><p>Start with the details, then add chapters or episodes to build your reader experience.</p></div>
          <span className="creator-draft-badge"><FileText size={13} /> {existingStory?.reviewStatus ?? "New draft"}</span>
        </div>

        <div className="creator-editor-grid">
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
              <p className="creator-field-hint">Image uploads are not connected yet. Use a public image URL for this prototype.</p>
            </section>

            <section className="creator-form-card">
              <div className="creator-form-heading"><span>02</span><div><h2>Chapters and episodes</h2><p>{format === "Comic" ? "Add panel images in reading order, one URL per line." : "Write a chapter for your novel or short story."}</p></div></div>
              {chapters.length > 0 && <div className="creator-chapter-list">
                {chapters.map((chapter, index) => (
                  <article className={"creator-chapter-item" + (editingChapterId === chapter.id ? " is-editing" : "")} key={chapter.id}>
                    <span className="creator-chapter-number">{String(index + 1).padStart(2, "0")}</span>
                    <div className="creator-chapter-copy"><strong>{chapter.title}</strong><span>{format === "Comic" ? chapter.panelUrls.length + " panel image URLs" : chapter.body.trim().split(/\s+/).filter(Boolean).length + " words"}</span></div>
                    <button type="button" className="creator-icon-button" onClick={() => editChapter(chapter)} aria-label={"Edit " + chapter.title}>Edit</button>
                    <button type="button" className="creator-icon-button creator-icon-button--danger" onClick={() => removeChapter(chapter.id)} aria-label={"Delete " + chapter.title}><Trash2 size={14} /></button>
                  </article>
                ))}
              </div>}
              <div className="creator-chapter-editor">
                <div className="creator-subheading"><h3>{editingChapterId ? "Edit chapter" : "Add a chapter"}</h3><span>{format}</span></div>
                <label className="creator-field"><span>Chapter / episode title <b>*</b></span><input value={chapterTitle} onChange={(event) => setChapterTitle(event.target.value)} placeholder="e.g. Chapter 1 — The Beginning" maxLength={100} /></label>
                {format === "Comic" ? (
                  <label className="creator-field"><span>Panel image URLs <b>*</b></span><textarea value={panelUrlsText} onChange={(event) => setPanelUrlsText(event.target.value)} rows={5} placeholder={"https://example.com/panel-01.jpg\nhttps://example.com/panel-02.jpg"} /><small>One public image URL per line. Panels appear in the order listed.</small></label>
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
                    {format === "Comic" ? (
                      <div className="creator-preview-panels">{panelUrlsText.split(/\r?\n/).map((url) => url.trim()).filter(Boolean).map((url, index) => <div key={url + index}><img src={url} alt={"Comic panel " + (index + 1)} /><span>Panel {index + 1}</span></div>)}</div>
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
              <button className="button-primary creator-wide-button" type="button" onClick={() => persistStory("Draft")}><Save size={15} /> Save draft</button>
              <button className="button-submit creator-wide-button" type="button" onClick={() => persistStory("In review")}><Send size={15} /> Submit for review</button>
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

function CreatorHeader({ active }: { active: "studio" }) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="brand" aria-label="StoryWorld home">
          <span className="brand-icon"><BookOpen size={20} /></span>
          <span>StoryWorld<span className="brand-period">.</span></span>
        </Link>
        <nav className="desktop-nav" aria-label="Creator navigation">
          <Link href="/">Home</Link>
          <Link href="/discover">Discover</Link>
          <Link href="/library">My Library</Link>
          <Link className={active === "studio" ? "nav-active" : ""} href="/creator">Creator Studio</Link>
        </nav>
        <div className="header-actions">
          <Link href="/creator/new" className="creator-button"><Plus size={14} /> New story</Link>
        </div>
      </div>
    </header>
  );
}
