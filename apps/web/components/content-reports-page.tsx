"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Archive, Check, CheckCheck, ExternalLink, EyeOff, Flag, LoaderCircle, ShieldCheck, Trash2, X } from "lucide-react";
import { AuthNav } from "@/components/auth-nav";
import styles from "./content-reports-page.module.css";

type ReportReason =
  | "SPAM"
  | "HARASSMENT"
  | "HATE_SPEECH"
  | "SEXUAL_CONTENT"
  | "VIOLENCE"
  | "COPYRIGHT"
  | "OTHER";
type ReportStatus = "PENDING" | "RESOLVED" | "DISMISSED";
type ReportFilter = "Pending" | "Reviewed" | "All";

type ContentReport = {
  id: string;
  targetType: "STORY" | "CHAPTER_COMMENT";
  targetId: string;
  targetTitle: string;
  targetExcerpt: string;
  targetUrl: string;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  decisionNote: string | null;
  moderationAction: "NONE" | "CONTENT_REMOVED";
  reviewedAt: string | null;
  createdAt: string;
  reporter: { id: string; displayName: string };
  reviewer: { id: string; displayName: string } | null;
};

type ReportResponse = {
  reports: ContentReport[];
  counts: { pending: number; resolved: number; dismissed: number };
  pagination: { page: number; limit: number; total: number; hasMore: boolean };
};

const REASON_LABELS: Record<ReportReason, string> = {
  SPAM: "Spam or misleading",
  HARASSMENT: "Harassment or bullying",
  HATE_SPEECH: "Hate speech",
  SEXUAL_CONTENT: "Sexual content",
  VIOLENCE: "Graphic or violent content",
  COPYRIGHT: "Copyright violation",
  OTHER: "Other",
};

async function responseMessage(response: Response, fallback: string) {
  try {
    const result = await response.json() as { error?: { message?: string } };
    return result.error?.message ?? fallback;
  } catch {
    return fallback;
  }
}

async function fetchReportPage(nextPage: number, currentFilter: ReportFilter) {
  const response = await fetch(
    "/api/v1/reports/moderation?filter=" + currentFilter + "&page=" + nextPage + "&limit=20",
    { credentials: "include", cache: "no-store", headers: { Accept: "application/json" } },
  );
  if (!response.ok) throw new Error(await responseMessage(response, "Reports could not be loaded."));
  return await response.json() as ReportResponse;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function statusLabel(status: ReportStatus) {
  if (status === "RESOLVED") return "Resolved";
  if (status === "DISMISSED") return "Dismissed";
  return "Pending";
}

export default function ContentReportsPage() {
  const [filter, setFilter] = useState<ReportFilter>("Pending");
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [counts, setCounts] = useState({ pending: 0, resolved: 0, dismissed: 0 });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  const loadFirstPage = useCallback(async (currentFilter: ReportFilter) => {
    const result = await fetchReportPage(1, currentFilter);
    setReports(result.reports);
    setCounts(result.counts);
    setPage(result.pagination.page);
    setHasMore(result.pagination.hasMore);
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setPage(1);
    void loadFirstPage(filter).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "Reports could not be loaded.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [filter, loadFirstPage]);

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setError("");
    try {
      const result = await fetchReportPage(page + 1, filter);
      setReports((current) => [...current, ...result.reports]);
      setPage(result.pagination.page);
      setHasMore(result.pagination.hasMore);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "More reports could not be loaded.");
    } finally {
      setLoadingMore(false);
    }
  }

  async function decide(report: ContentReport, decision: "RESOLVED" | "DISMISSED", removeContent = false) {
    if (pendingId) return;
    if (removeContent) {
      const action = report.targetType === "STORY" ? "Unpublish this story" : "Remove this comment";
      if (!window.confirm(action + "? The content will no longer appear publicly. This action will be recorded.")) return;
    }
    const note = notes[report.id]?.trim() ?? "";
    setPendingId(report.id);
    setError("");
    try {
      const response = await fetch(
        "/api/v1/reports/moderation/" + encodeURIComponent(report.id) + "/decision",
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ decision, note, removeContent }),
        },
      );
      if (!response.ok) throw new Error(await responseMessage(response, "The report could not be updated."));
      const result = await response.json() as { report: ContentReport };
      setReports((current) => current.map((item) => item.id === report.id ? result.report : item));
      setCounts((current) => ({
        pending: Math.max(0, current.pending - 1),
        resolved: current.resolved + (decision === "RESOLVED" ? 1 : 0),
        dismissed: current.dismissed + (decision === "DISMISSED" ? 1 : 0),
      }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The report could not be updated.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <Link href="/" className="brand" aria-label="StoryWorld home">
            <span className="brand-icon"><ShieldCheck size={20} /></span>
            <span>StoryWorld<span className="brand-period">.</span></span>
          </Link>
          <nav className="desktop-nav" aria-label="Moderation navigation">
            <Link href="/">Home</Link>
            <Link href="/admin/reviews">Review queue</Link>
            <Link className="nav-active" href="/admin/reports">Content reports</Link>
          </nav>
          <div className="header-actions"><AuthNav /></div>
        </div>
      </header>

      <main className={styles.shell}>
        <Link className={styles.back} href="/admin/reviews"><ArrowLeft size={14} /> Back to review queue</Link>
        <section className={styles.hero}>
          <div>
            <span className={styles.eyebrow}><ShieldCheck size={13} /> COMMUNITY SAFETY</span>
            <h1>Content reports</h1>
            <p>Review stories and chapter comments reported by readers.</p>
          </div>
          <div className={styles.heroIcon}><Flag size={25} /></div>
        </section>

        <section className={styles.metrics} aria-label="Report totals">
          <article><span>Pending</span><strong>{counts.pending}</strong></article>
          <article><span>Resolved</span><strong>{counts.resolved}</strong></article>
          <article><span>Dismissed</span><strong>{counts.dismissed}</strong></article>
        </section>

        <div className={styles.toolbar}>
          <div className={styles.tabs} role="group" aria-label="Filter reports">
            {(["Pending", "Reviewed", "All"] as ReportFilter[]).map((item) => (
              <button type="button" key={item} className={filter === item ? styles.activeTab : ""} aria-pressed={filter === item} onClick={() => setFilter(item)}>{item}</button>
            ))}
          </div>
          <span>{reports.length} shown</span>
        </div>

        {error && <p className={styles.error} role="alert"><AlertCircle size={14} /> {error}</p>}

        {loading ? (
          <div className={styles.loading}><LoaderCircle size={18} /> Loading reports…</div>
        ) : reports.length === 0 ? (
          <div className={styles.empty}>
            <span><CheckCheck size={22} /></span>
            <h2>{filter === "Pending" ? "No pending reports" : "No reports found"}</h2>
            <p>{filter === "Pending" ? "New reports from readers will appear here." : "There are no reports matching this filter."}</p>
          </div>
        ) : (
          <div className={styles.list}>
            {reports.map((report) => (
              <article className={styles.report} key={report.id}>
                <div className={styles.reportTop}>
                  <div className={styles.targetType}>{report.targetType === "STORY" ? "STORY REPORT" : "CHAPTER COMMENT REPORT"}</div>
                  <span className={report.status === "PENDING" ? styles.pendingStatus : report.status === "RESOLVED" ? styles.resolvedStatus : styles.dismissedStatus}>{statusLabel(report.status)}</span>
                </div>
                <div className={styles.reportBody}>
                  <div className={styles.reportMain}>
                    <div className={styles.titleLine}>
                      <h2>{report.targetTitle}</h2>
                      <Link href={report.targetUrl} target="_blank" rel="noreferrer" aria-label="Open reported content"><ExternalLink size={14} /></Link>
                    </div>
                    <blockquote>{report.targetExcerpt}</blockquote>
                    <div className={styles.meta}>
                      <span>Reason: <strong>{REASON_LABELS[report.reason]}</strong></span>
                      <span>Reported by {report.reporter.displayName}</span>
                      <time dateTime={report.createdAt}>{formatDate(report.createdAt)}</time>
                    </div>
                    {report.details && <div className={styles.details}><strong>Reader details</strong><p>{report.details}</p></div>}
                    {report.status !== "PENDING" && (
                      <div className={styles.reviewed}>
                        <strong>{statusLabel(report.status)} by {report.reviewer?.displayName ?? "moderator"}</strong>
                        {report.reviewedAt && <time dateTime={report.reviewedAt}>{formatDate(report.reviewedAt)}</time>}
                        {report.moderationAction === "CONTENT_REMOVED" && <p className={styles.removalRecord}>Content removed by moderator.</p>}
                        {report.decisionNote && <p>{report.decisionNote}</p>}
                      </div>
                    )}
                  </div>
                  {report.status === "PENDING" && (
                    <div className={styles.decision}>
                      <label>
                        <span>Moderator note <small>(optional)</small></span>
                        <textarea
                          value={notes[report.id] ?? ""}
                          onChange={(event) => setNotes((current) => ({ ...current, [report.id]: event.target.value }))}
                          rows={3}
                          maxLength={2000}
                          placeholder="Add an internal note about this decision..."
                        />
                      </label>
                      <div>
                        <button type="button" className={styles.resolve} onClick={() => void decide(report, "RESOLVED")} disabled={pendingId !== null}>
                          <Check size={14} /> Resolve
                        </button>
                        <button
                          type="button"
                          className={styles.removeContent}
                          onClick={() => void decide(report, "RESOLVED", true)}
                          disabled={pendingId !== null}
                          aria-label={report.targetType === "STORY" ? "Unpublish story" : "Remove comment"}
                          title={report.targetType === "STORY" ? "Unpublish story" : "Remove comment"}
                        >
                          {report.targetType === "STORY" ? <EyeOff size={14} /> : <Trash2 size={14} />}
                          {pendingId === report.id ? "Saving…" : report.targetType === "STORY" ? "Unpublish" : "Remove"}
                        </button>
                        <button type="button" className={styles.dismiss} onClick={() => void decide(report, "DISMISSED")} disabled={pendingId !== null}>
                          <X size={14} /> Dismiss
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {hasMore && !loading && (
          <button className={styles.loadMore} type="button" onClick={() => void loadMore()} disabled={loadingMore}>
            {loadingMore ? "Loading…" : "Load more reports"}
          </button>
        )}
      </main>
    </>
  );
}
