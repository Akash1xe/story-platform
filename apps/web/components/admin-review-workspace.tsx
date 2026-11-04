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
  decideModerationSubmission,
  listModerationSubmissions,
  type ModerationDecision,
  type ModerationFilter
} from "@/lib/moderation-api";
import { formatCreatorDate, type CreatorReviewStatus, type CreatorStory } from "@/lib/creator-content";
import { AuthNav } from "@/components/auth-nav";

type ReviewDecision = "Approved" | "Changes requested";

function statusClass(status: CreatorReviewStatus): string {
  if (status === "Approved") return "creator-status creator-status--approved";
  if (status === "In review") return "creator-status creator-status--review";
  if (status === "Changes requested") return "creator-status creator-status--changes";
  return "creator-status";
}

function reviewWordCount(story: CreatorStory): number {
  return story.chapters.reduce((total, chapter) => {
    return total + chapter.body.trim().split(/\\s+/).filter(Boolean).length;
  }, 0);
}

export default function AdminReviewWorkspace() {
  const [stories, setStories] = useState<CreatorStory[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [filter, setFilter] = useState<ModerationFilter>("Pending");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadSubmissions() {
      try {
        const loaded = await listModerationSubmissions("All");
        if (!active) return;
        setStories(loaded);
        const firstPending = loaded.find((story) => story.reviewStatus === "In review");
        setSelectedId(firstPending?.id ?? loaded[0]?.id ?? null);
      } catch (loadFailure) {
        if (active) {
          setLoadError(loadFailure instanceof Error ? loadFailure.message : "Could not load submissions.");
        }
      } finally {
        if (active) setIsReady(true);
      }
    }

    void loadSubmissions();
    return () => {
      active = false;
    };
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
        const searchable = [
          story.title,
          story.synopsis,
          story.genre,
          story.format,
          story.authorName ?? ""
        ].join(" ").toLowerCase();
        return matchesFilter && (!normalizedQuery || searchable.includes(normalizedQuery));
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [stories, filter, query]);

  useEffect(() => {
    if (selectedId && visibleStories.some((story) => story.id === selectedId)) return;
    if (visibleStories.length > 0) setSelectedId(visibleStories[0].id);
    else if (selectedId) setSelectedId(null);
  }, [visibleStories, selectedId]);

  const selectedStory = useMemo(
    () => visibleStories.find((story) => story.id === selectedId) ?? null,
    [visibleStories, selectedId]
  );

  useEffect(() => {
    setReviewNote(selectedStory?.reviewNote ?? "");
    setError("");
  }, [selectedStory?.id, selectedStory?.reviewNote]);

  function selectFilter(nextFilter: ModerationFilter) {
    setFilter(nextFilter);
    setFeedback("");
  }

  async function decide(decision: ReviewDecision) {
    if (!selectedStory || selectedStory.reviewStatus !== "In review" || isSaving) return;
    const note = reviewNote.trim();

    if (decision === "Changes requested" && note.length < 12) {
      setError("Add a review note of at least 12 characters so the creator knows what to change.");
      return;
    }

    setIsSaving(true);
    setError("");
    setFeedback("");

    try {
      const apiDecision: ModerationDecision =
        decision === "Approved" ? "APPROVED" : "CHANGES_REQUESTED";
      const updated = await decideModerationSubmission(selectedStory.id, apiDecision, note);
      setStories((current) => [
        updated,
        ...current.filter((story) => story.id !== updated.id)
      ]);
      setFeedback(
        decision === "Approved"
          ? "Story approved and published. The decision is saved to the moderation history."
          : "Changes requested. The story is back in the creator’s editable drafts with your note."
      );
      setFilter("Reviewed");
    } catch (decisionFailure) {
      setError(decisionFailure instanceof Error ? decisionFailure.message : "The decision could not be saved.");
    } finally {
      setIsSaving(false);
    }
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
            <AuthNav />
          </div>
        </div>
      </header>

      <main className="admin-shell">
        <div className="admin-breadcrumb"><Link href="/creator"><ArrowLeft size={14} /> Creator Studio</Link><span>/</span><span>Review queue</span></div>

        <section className="admin-welcome">
          <div>
            <span className="eyebrow"><ShieldAlert size={13} /> MODERATION WORKSPACE</span>
            <h1>Review the next <span>great story.</span></h1>
            <p>Inspect creator submissions, leave actionable feedback and publish approved stories through a server-recorded decision.</p>
          </div>
          <div className="admin-welcome-art"><Inbox size={35} /><span>QUALITY<br />BEFORE<br />PUBLISHING</span></div>
        </section>

        <div className="admin-prototype-warning" role="note">
          <AlertCircle size={17} />
          <div><strong>Database-backed moderation</strong><span>Submissions are loaded from PostgreSQL. Approval publishes the story and its chapters; requesting changes returns the story to an editable draft and stores your review note.</span></div>
        </div>

        <section className="admin-metrics" aria-label="Moderation totals">
          <article><span className="admin-metric-icon"><Clock3 size={17} /></span><strong>{isReady ? counts.pending : "—"}</strong><span>Awaiting review</span></article>
          <article><span className="admin-metric-icon"><CheckCircle2 size={17} /></span><strong>{isReady ? counts.approved : "—"}</strong><span>Published after approval</span></article>
          <article><span className="admin-metric-icon"><MessageSquareText size={17} /></span><strong>{isReady ? counts.changes : "—"}</strong><span>Changes requested</span></article>
        </section>

        <section className="admin-review-layout">
          <aside className="admin-queue">
            <div className="admin-queue-heading"><div><span className="eyebrow">SUBMISSIONS</span><h2>Review queue</h2></div><span className="admin-queue-count">{visibleStories.length}</span></div>
            <label className="admin-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search submissions..." aria-label="Search submissions" /></label>
            <div className="admin-filter-tabs" role="group" aria-label="Filter submissions">
              {(["Pending", "Reviewed", "All"] as ModerationFilter[]).map((item) => (
                <button key={item} type="button" className={filter === item ? "is-active" : ""} aria-pressed={filter === item} onClick={() => selectFilter(item)}>{item}</button>
              ))}
            </div>
            {!isReady ? (
              <div className="admin-queue-empty">Loading submissions…</div>
            ) : loadError ? (
              <div className="admin-queue-empty"><AlertCircle size={23} /><strong>Could not load the queue</strong><span>{loadError}</span></div>
            ) : visibleStories.length ? (
              <div className="admin-submission-list">
                {visibleStories.map((story) => (
                  <button key={story.id} type="button" className={"admin-submission" + (selectedId === story.id ? " is-selected" : "")} onClick={() => { setSelectedId(story.id); setFeedback(""); }}>
                    <span className="admin-submission-top"><span>{story.format}</span><span className={statusClass(story.reviewStatus)}>{story.reviewStatus}</span></span>
                    <strong>{story.title || "Untitled story"}</strong>
                    <span className="admin-submission-meta">{story.genre || "Genre not set"} · {story.chapters.length} {story.chapters.length === 1 ? "chapter" : "chapters"}{story.authorName ? " · " + story.authorName : ""}</span>
                    <span className="admin-submission-date">Updated {formatCreatorDate(story.updatedAt)}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="admin-queue-empty"><Inbox size={23} /><strong>{filter === "Pending" ? "No submissions to review" : "No matching submissions"}</strong><span>{filter === "Pending" ? "New creator submissions will appear here when they are sent for review." : "Try another filter or clear the search."}</span></div>
            )}
          </aside>

          <section className="admin-review-detail" aria-label="Selected submission">
            {selectedStory ? (
              <>
                <div className="admin-detail-heading">
                  <div><span className="eyebrow">SUBMISSION DETAILS</span><h2>{selectedStory.title || "Untitled story"}</h2><p>Submitted by {selectedStory.authorName || "creator"} · Last updated {formatCreatorDate(selectedStory.updatedAt)}</p></div>
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
                        <summary><span className="admin-chapter-index">{String(index + 1).padStart(2, "0")}</span><strong>{chapter.title}</strong><span>{selectedStory.format === "Comic" ? chapter.panelUrls.length + " panels" : chapter.body.trim().split(/\\s+/).filter(Boolean).length + " words"}</span></summary>
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
                  <label className="admin-review-note"><span>Feedback to creator {selectedStory.reviewStatus === "In review" ? "(required when requesting changes)" : ""}</span><textarea value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} rows={4} disabled={selectedStory.reviewStatus !== "In review" || isSaving} placeholder="Explain what is working well or what needs to be improved..." /></label>
                  {selectedStory.reviewStatus === "In review" ? (
                    <div className="admin-decision-actions">
                      <button className="admin-approve-button" type="button" disabled={isSaving} onClick={() => void decide("Approved")}><Check size={15} /> {isSaving ? "Saving…" : "Approve & publish"}</button>
                      <button className="admin-return-button" type="button" disabled={isSaving} onClick={() => void decide("Changes requested")}><MessageSquareText size={15} /> Request changes</button>
                    </div>
                  ) : (
                    <div className="admin-reviewed-state"><CheckCircle2 size={16} /><span>{selectedStory.reviewStatus === "Approved" ? "This story is published and its chapters are available for readers." : "Changes were requested. The creator can edit the draft and submit it again."}</span></div>
                  )}
                  {selectedStory.reviewNote && <div className="admin-saved-note"><strong>Latest review note</strong><p>{selectedStory.reviewNote}</p></div>}
                  {feedback && <p className="admin-feedback" role="status">{feedback}</p>}
                  {error && <p className="admin-error" role="alert"><XCircle size={14} />{error}</p>}
                </section>
              </>
            ) : (
              <div className="admin-detail-empty"><span><FileText size={28} /></span><h3>Select a submission</h3><p>Choose a story from the queue to inspect its details and chapters.</p><Link href="/creator" className="button-secondary">Open Creator Studio</Link></div>
            )}
          </section>
        </section>

        <div className="admin-footer-note"><Filter size={14} /> Every moderator decision is stored with its reviewer and timestamp. Approval publishes the story; requested changes return it to the creator as a draft.</div>
      </main>
    </>
  );
}
