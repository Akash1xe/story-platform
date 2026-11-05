"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Clock3, FileText, LoaderCircle, MessageSquareText } from "lucide-react";
import { AuthNav } from "@/components/auth-nav";
import { CreatorHeader } from "@/components/creator-workspace";
import {
  listCreatorReviews,
  type CreatorReviewEntry,
} from "@/lib/creator-api";
import styles from "./creator-review-history.module.css";

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function decisionLabel(decision: CreatorReviewEntry["decision"]) {
  return decision === "APPROVED" ? "Approved" : "Changes requested";
}

function formatLabel(format: CreatorReviewEntry["story"]["format"]) {
  if (format === "COMIC") return "Comic";
  if (format === "SHORT_STORY") return "Short story";
  return "Novel";
}

export function CreatorReviewHistory() {
  const [reviews, setReviews] = useState<CreatorReviewEntry[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    listCreatorReviews()
      .then((result) => {
        if (!active) return;
        setReviews(result.reviews);
        setPage(result.pagination.page);
        setHasMore(result.pagination.hasMore);
        setTotal(result.pagination.total);
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : "Review history could not be loaded.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setError("");
    try {
      const result = await listCreatorReviews(page + 1);
      setReviews((current) => [...current, ...result.reviews]);
      setPage(result.pagination.page);
      setHasMore(result.pagination.hasMore);
      setTotal(result.pagination.total);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "More review history could not be loaded.");
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <>
      <CreatorHeader active="reviews" />
      <main className={styles.shell}>
        <Link className={styles.back} href="/creator"><ArrowLeft size={14} /> Back to Creator Studio</Link>

        <section className={styles.hero}>
          <div>
            <span className={styles.eyebrow}><Clock3 size={13} /> CREATOR RECORD</span>
            <h1>Review history</h1>
            <p>Every moderator decision for your stories, with the feedback attached.</p>
          </div>
          <div className={styles.heroIcon} aria-hidden="true"><MessageSquareText size={30} /></div>
        </section>

        <div className={styles.summary}>
          <span><FileText size={14} /> {loading ? "Loading…" : `${total} ${total === 1 ? "review" : "reviews"} recorded`}</span>
          <span>Newest decisions first</span>
        </div>

        {error && <div className={styles.error} role="alert"><AlertCircle size={15} /> {error}</div>}

        {loading ? (
          <div className={styles.state}><LoaderCircle size={19} className={styles.spinner} /> Loading your review history…</div>
        ) : reviews.length === 0 ? (
          <section className={styles.empty}>
            <span><MessageSquareText size={25} /></span>
            <h2>No review decisions yet</h2>
            <p>When a moderator reviews one of your submissions, the decision and any feedback will appear here.</p>
            <Link href="/creator" className={styles.primaryLink}>Return to Creator Studio <ArrowRight size={14} /></Link>
          </section>
        ) : (
          <>
            <div className={styles.list}>
              {reviews.map((review) => {
                const approved = review.decision === "APPROVED";
                return (
                  <article className={styles.review} key={review.id}>
                    <div className={styles.reviewTop}>
                      <span className={approved ? styles.approved : styles.changes}>
                        {approved ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                        {decisionLabel(review.decision)}
                      </span>
                      <time dateTime={review.createdAt}>{formatDate(review.createdAt)}</time>
                    </div>

                    <div className={styles.storyRow}>
                      <div className={styles.storyIcon}><FileText size={18} /></div>
                      <div className={styles.storyInfo}>
                        <h2>{review.story.title || "Untitled story"}</h2>
                        <p>{formatLabel(review.story.format)} <span>·</span> Reviewed by {review.reviewer.displayName}</p>
                      </div>
                      <Link href={"/creator/" + encodeURIComponent(review.story.id)} className={styles.storyLink}>
                        Open story <ArrowRight size={13} />
                      </Link>
                    </div>

                    <div className={styles.feedback}>
                      <strong>{approved ? "Moderator feedback" : "Changes requested"}</strong>
                      <p>{review.note?.trim() || (approved ? "The submission was approved without additional notes." : "No written feedback was provided for this decision.")}</p>
                    </div>
                  </article>
                );
              })}
            </div>

            {hasMore && (
              <button className={styles.loadMore} type="button" onClick={() => void loadMore()} disabled={loadingMore}>
                {loadingMore ? <><LoaderCircle size={14} className={styles.spinner} /> Loading…</> : "Load older reviews"}
              </button>
            )}
          </>
        )}
      </main>
    </>
  );
}
