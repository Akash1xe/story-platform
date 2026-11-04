"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  Clock3,
  FileText,
  Filter,
  Inbox,
  MessageSquareText,
  Search,
  ShieldAlert,
  XCircle
} from "lucide-react";
import {
  formatCreatorDate,
  readCreatorStories,
  writeCreatorStories,
  type CreatorReviewStatus,
  type CreatorStory
} from "@/lib/creator-content";

type ReviewFilter = "Pending" | "Reviewed" | "All";
type ReviewDecision = "Approved" | "Changes requested";

function statusClass(status: CreatorReviewStatus): string {
  if (status === "Approved") return "creator-status creator-status--approved";
  if (status === "In review") return "creator-status creator-status--review";
  if (status === "Changes requested") return "creator-status creator-status--changes";
  return "creator-status";
}

function reviewWordCount(story: CreatorStory): number {
  return story.chapters.reduce((total, chapter) => {
    return total + chapter.body.trim().split(/\s+/).filter(Boolean).length;
  }, 0);
}

export default function AdminReviewWorkspace() {
  const [stories, setStories] = useState<CreatorStory[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [filter, setFilter] = useState<ReviewFilter>("Pending");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = readCreatorStories();
    setStories(stored);
    const firstPending = stored.find((story) => story.reviewStatus === "In review");
    setSelectedId(firstPending?.id ?? stored[0]?.id ?? null);
    setIsReady(true);
  }, []);

  const counts = useMemo(() => ({
    pending: stories.filter((story) => story.reviewStatus === "In review").length,
    approved: stories.filter((story) => story.reviewStatus === "Approved").length,
    changes: stories.filter((story) => story.reviewStatus === "Changes requested").length
  }), [stories]);

  const visibleStories = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return stories
      .filter((story) => {
        const matchesFilter =
          filter === "All" ||
          (filter === "Pending" && story.reviewStatus === "In review") ||
          (filter === "Reviewed" &&
            (story.reviewStatus === "Approved" || story.reviewStatus === "Changes requested"));
        const searchable = [story.title, story.synopsis, story.genre, story.format].join(" ").toLowerCase();
        return matchesFilter && (!normalizedQuery || searchable.includes(normalizedQuery));
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [stories, filter, query]);

  useEffect(() => {
    if (visibleStories.some((story) => story.id === selectedId)) return;
    setSelectedId(visibleStories[0]?.id ?? null);
  }, [visibleStories, selectedId]);

  const selectedStory = useMemo(
    () => visibleStories.find((story) => story.id === selectedId) ?? null,
    [visibleStories, selectedId]
  );

  useEffect(() => {
    setReviewNote(selectedStory?.reviewNote ?? "");
    setError("");
  }, [selectedStory?.id, selectedStory?.reviewNote]);

  function selectFilter(nextFilter: ReviewFilter) {
    setFilter(nextFilter);
    setFeedback("");
  }

  function decide(decision: ReviewDecision) {
    if (!selectedStory || selectedStory.reviewStatus !== "In review") return;
    const note = reviewNote.trim();

    if (decision === "Changes requested" && note.length < 12) {
      setError("Add a review note of at least 12 characters so the creator knows what to change.");
      return;
    }

    const timestamp = Date.now();
    const nextStories = stories.map((story) =>
      story.id === selectedStory.id
        ? {
            ...story,
            reviewStatus: decision,
            reviewNote: note,
            updatedAt: timestamp
          }
        : story
    );

    if (!writeCreatorStories(nextStories)) {
      setError("The browser could not save this review decision. Storage may be unavailable.");
      return;
    }

    setStories(nextStories);
    setFeedback(
      decision === "Approved"
        ? "Marked approved in this browser. This does not publish the story to readers."
        : "Changes requested. The review note is saved with this local draft."
    );
    setError("");
    setFilter("Reviewed");
  }

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <Link href="/" className="brand" aria-label="StoryWorld home">
            <span className="brand-icon"><BookOpen size={20} /></span>
            <span>StoryWorld<span className="brand-period">.</span></span>
          </Link>
          <nav className="desktop-nav" aria-label="Admin navigation">
            <Link href="/">Home</Link>
            <Link href="/discover">Discover</Link>
            <Link href="/creator">Creator Studio</Link>
            <Link className="nav-active" href="/admin/reviews">Review queue</Link>
          </nav>
          <div className="header-actions">
            <Link href="/creator" className="creator-button">Creator workspace</Link>
          </div>
        </div>
      </header>

      <main className="admin-shell">
        <div className="admin-breadcrumb"><Link href="/creator"><ArrowLeft size={14} /> Creator Studio</Link><span>/</span><span>Admin review preview</span></div>

        <section className="admin-welcome">
          <div>
            <span className="eyebrow"><ShieldAlert size={13} /> MODERATION WORKSPACE</span>
            <h1>Review the next <span>great story.</span></h1>
            <p>Check submissions, read their chapters and give creators a clear decision before anything is considered for publication.</p>
          </div>
          <div className="admin-welcome-art"><Inbox size={35} /><span>QUALITY<br />BEFORE<br />PUBLISHING</span></div>
        </section>

        <div className="admin-prototype-warning" role="note">
          <AlertCircle size={17} />
          <div><strong>Local admin preview — not access-controlled</strong><span>This queue reads browser storage on this device. It is not a real admin role, submissions are not shared between users or devices, and approval does not publish content. Do not use this route for real moderation until server authentication and authorization are added.</span></div>
        </div>

        <section className="admin-metrics" aria-label="Moderation totals">
          <article><span className="admin-metric-icon"><Clock3 size={17} /></span><strong>{isReady ? counts.pending : "—"}</strong><span>Awaiting review</span></article>
          <article><span className="admin-metric-icon"><CheckCircle2 size={17} /></span><strong>{isReady ? counts.approved : "—"}</strong><span>Marked approved</span></article>
          <article><span className="admin-metric-icon"><MessageSquareText size={17} /></span><strong>{isReady ? counts.changes : "—"}</strong><span>Changes requested</span></article>
        </section>

        <section className="admin-review-layout">
          <aside className="admin-queue">
            <div className="admin-queue-heading"><div><span className="eyebrow">SUBMISSIONS</span><h2>Review queue</h2></div><span className="admin-queue-count">{visibleStories.length}</span></div>
            <label className="admin-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search submissions..." aria-label="Search submissions" /></label>
            <div className="admin-filter-tabs" role="group" aria-label="Filter submissions">
              {(["Pending", "Reviewed", "All"] as ReviewFilter[]).map((item) => (
                <button key={item} type="button" className={filter === item ? "is-active" : ""} aria-pressed={filter === item} onClick={() => selectFilter(item)}>{item}</button>
              ))}
            </div>
            {!isReady ? (
              <div className="admin-queue-empty">Loading submissions…</div>
            ) : visibleStories.length ? (
              <div className="admin-submission-list">
                {visibleStories.map((story) => (
                  <button key={story.id} type="button" className={"admin-submission" + (selectedId === story.id ? " is-selected" : "")} onClick={() => { setSelectedId(story.id); setFeedback(""); }}>
                    <span className="admin-submission-top"><span>{story.format}</span><span className={statusClass(story.reviewStatus)}>{story.reviewStatus}</span></span>
                    <strong>{story.title || "Untitled story"}</strong>
                    <span className="admin-submission-meta">{story.genre || "Genre not set"} · {story.chapters.length} {story.chapters.length === 1 ? "chapter" : "chapters"}</span>
                    <span className="admin-submission-date">Updated {formatCreatorDate(story.updatedAt)}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="admin-queue-empty"><Inbox size={23} /><strong>{filter === "Pending" ? "No submissions to review" : "No matching submissions"}</strong><span>{filter === "Pending" ? "When a creator submits a complete work from this browser, it will appear here." : "Try another filter or clear the search."}</span></div>
            )}
          </aside>

          <section className="admin-review-detail" aria-label="Selected submission">
            {selectedStory ? (
              <>
                <div className="admin-detail-heading">
                  <div><span className="eyebrow">SUBMISSION DETAILS</span><h2>{selectedStory.title || "Untitled story"}</h2><p>Submitted locally · {formatCreatorDate(selectedStory.updatedAt)}</p></div>
                  <span className={statusClass(selectedStory.reviewStatus)}>{selectedStory.reviewStatus}</span>
                </div>

                <div className="admin-story-summary">
                  <div className="admin-cover" style={selectedStory.coverImage ? { backgroundImage: "url(" + JSON.stringify(selectedStory.coverImage) + ")" } : undefined}>{!selectedStory.coverImage && <BookOpen size={25} />}</div>
                  <div><div className="admin-story-tags"><span>{selectedStory.format}</span><span>{selectedStory.genre || "Genre not set"}</span><span>{selectedStory.publicationStatus}</span></div><p>{selectedStory.synopsis || "No synopsis provided."}</p><div className="admin-story-stats"><span>{selectedStory.chapters.length} chapters / episodes</span>{selectedStory.format !== "Comic" && <span>{reviewWordCount(selectedStory).toLocaleString()} words</span>}</div></div>
                </div>

                <div className="admin-chapters-heading"><div><span className="eyebrow">CREATOR CONTENT</span><h3>Chapters and episodes</h3></div><span>{selectedStory.chapters.length} total</span></div>
                {selectedStory.chapters.length ? (
                  <div className="admin-chapter-list">
                    {selectedStory.chapters.map((chapter, index) => (
                      <details className="admin-chapter" key={chapter.id} open={index === 0}>
                        <summary><span className="admin-chapter-index">{String(index + 1).padStart(2, "0")}</span><strong>{chapter.title}</strong><span>{selectedStory.format === "Comic" ? chapter.panelUrls.length + " panels" : chapter.body.trim().split(/\s+/).filter(Boolean).length + " words"}</span></summary>
                        <div className="admin-chapter-content">
                          {selectedStory.format === "Comic" ? (
                            chapter.panelUrls.length ? <div className="admin-panel-gallery">{chapter.panelUrls.map((url, panelIndex) => <figure key={url + panelIndex}><img src={url} alt={chapter.title + " panel " + (panelIndex + 1)} loading="lazy" /><figcaption>Panel {panelIndex + 1}</figcaption></figure>)}</div> : <p className="admin-no-content">No panel images saved.</p>
                          ) : <p className="admin-prose-preview">{chapter.body || "No chapter text saved."}</p>}
                        </div>
                      </details>
                    ))}
                  </div>
                ) : <div className="admin-no-content">This submission has no chapters.</div>}

                <section className="admin-decision">
                  <div className="admin-decision-heading"><div><span className="eyebrow">MODERATION DECISION</span><h3>Leave a review</h3></div><span className="admin-decision-hint">Only pending items can be decided</span></div>
                  <label className="admin-review-note"><span>Feedback to creator {selectedStory.reviewStatus === "In review" ? "(required when requesting changes)" : ""}</span><textarea value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} rows={4} disabled={selectedStory.reviewStatus !== "In review"} placeholder="Explain what is working well or what needs to be improved..." /></label>
                  {selectedStory.reviewStatus === "In review" ? (
                    <div className="admin-decision-actions">
                      <button className="admin-approve-button" type="button" onClick={() => decide("Approved")}><Check size={15} /> Mark approved</button>
                      <button className="admin-return-button" type="button" onClick={() => decide("Changes requested")}><MessageSquareText size={15} /> Request changes</button>
                    </div>
                  ) : (
                    <div className="admin-reviewed-state"><CheckCircle2 size={16} /><span>{selectedStory.reviewStatus === "Approved" ? "This item has been marked approved in the local prototype." : "Changes were requested. The creator can edit and resubmit this draft."}</span></div>
                  )}
                  {selectedStory.reviewNote && <div className="admin-saved-note"><strong>Saved review note</strong><p>{selectedStory.reviewNote}</p></div>}
                  {feedback && <p className="admin-feedback" role="status">{feedback}</p>}
                  {error && <p className="admin-error" role="alert"><XCircle size={14} />{error}</p>}
                </section>
              </>
            ) : (
              <div className="admin-detail-empty"><span><FileText size={28} /></span><h3>Select a submission</h3><p>Choose a story from the queue to inspect its details and chapters.</p><Link href="/creator" className="button-secondary">Open Creator Studio</Link></div>
            )}
          </section>
        </section>

        <div className="admin-footer-note"><Filter size={14} /> Decisions in this preview only change local browser storage. The production flow will need a moderator identity, an auditable review history and server-enforced publication states.</div>
      </main>
    </>
  );
}
