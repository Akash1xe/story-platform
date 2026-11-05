"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import styles from "./story-rating.module.css";

type StoryRatingProps = {
  slug: string;
  ownerId: string;
};

type RatingSummary = {
  averageRating: number | null;
  ratingCount: number;
};

type RatingResponse = {
  summary?: RatingSummary;
  rating?: { value: number; updatedAt: string } | null;
};

async function readResponse<T>(response: Response, fallback: string): Promise<T> {
  const payload = await response.json().catch(() => null) as
    | { error?: { message?: string }; summary?: RatingSummary; rating?: { value: number; updatedAt: string } | null }
    | null;
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? fallback);
  }
  return payload as T;
}

export default function StoryRating({ slug, ownerId }: StoryRatingProps) {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const [summary, setSummary] = useState<RatingSummary | null>(null);
  const [myRating, setMyRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (sessionPending) return;
    let active = true;
    setLoading(true);
    setError("");

    const summaryRequest = fetch("/api/v1/ratings/" + encodeURIComponent(slug), {
      credentials: "include",
      cache: "no-store",
      headers: { Accept: "application/json" },
    }).then((response) => readResponse<RatingResponse>(response, "The rating summary could not be loaded."));

    const myRatingRequest = session?.user
      ? fetch("/api/v1/ratings/" + encodeURIComponent(slug) + "/me", {
          credentials: "include",
          cache: "no-store",
          headers: { Accept: "application/json" },
        }).then((response) => readResponse<RatingResponse>(response, "Your rating could not be loaded."))
      : Promise.resolve(null);

    Promise.all([summaryRequest, myRatingRequest])
      .then(([summaryResult, myRatingResult]) => {
        if (!active) return;
        setSummary(summaryResult.summary ?? null);
        setMyRating(myRatingResult?.rating?.value ?? null);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Ratings could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug, session?.user?.id, sessionPending]);

  async function saveRating(value: number) {
    if (!session?.user || saving) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/v1/ratings/" + encodeURIComponent(slug), {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ value }),
      });
      const result = await readResponse<RatingResponse>(response, "Your rating could not be saved.");
      setMyRating(result.rating?.value ?? value);
      if (result.summary) setSummary(result.summary);
      setNotice("Your rating is saved.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Your rating could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function clearRating() {
    if (!session?.user || saving || myRating === null) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/v1/ratings/" + encodeURIComponent(slug), {
        method: "DELETE",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      const result = await readResponse<RatingResponse>(response, "Your rating could not be removed.");
      setMyRating(null);
      if (result.summary) setSummary(result.summary);
      setNotice("Your rating was removed.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Your rating could not be removed.");
    } finally {
      setSaving(false);
    }
  }

  const displayRating = hoveredRating ?? myRating ?? Math.round(summary?.averageRating ?? 0);
  const isOwner = session?.user?.id === ownerId;

  return (
    <section className={styles.rating} aria-label="Story rating">
      <div className={styles.summary}>
        <span className={styles.average}>
          {loading ? "—" : summary?.averageRating == null ? "New" : summary?.averageRating.toFixed(1)}
        </span>
        <div>
          <div className={styles.stars} aria-hidden="true">
            {[1, 2, 3, 4, 5].map((value) => (
              <Star key={value} size={14} fill={value <= Math.round(summary?.averageRating ?? 0) ? "currentColor" : "none"} />
            ))}
          </div>
          <span className={styles.count}>
            {loading ? "Loading ratings…" : summary?.ratingCount === 0 ? "No ratings yet" : String(summary?.ratingCount) + (summary?.ratingCount === 1 ? " rating" : " ratings")}
          </span>
        </div>
      </div>

      <div className={styles.rateArea}>
        <span className={styles.prompt}>{isOwner ? "Your own story" : session?.user ? "Your rating" : "Enjoying this story?"}</span>
        {isOwner ? (
          <span className={styles.helper}>Creators can’t rate their own work.</span>
        ) : session?.user ? (
          <>
            <div className={styles.controls} role="group" aria-label="Choose a rating from 1 to 5 stars">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-label={"Rate " + value + " out of 5 stars"}
                  aria-pressed={myRating === value}
                  title={value + " out of 5 stars"}
                  disabled={saving || loading}
                  onMouseEnter={() => setHoveredRating(value)}
                  onMouseLeave={() => setHoveredRating(null)}
                  onFocus={() => setHoveredRating(value)}
                  onBlur={() => setHoveredRating(null)}
                  onClick={() => void saveRating(value)}
                >
                  <Star size={19} fill={value <= displayRating ? "currentColor" : "none"} />
                </button>
              ))}
            </div>
            <span className={styles.helper}>{myRating ? "You rated this " + myRating + " out of 5. Select another star to update." : "Choose a star to rate this story."}</span>
            {myRating !== null && <button className={styles.clear} type="button" onClick={() => void clearRating()} disabled={saving}>Remove my rating</button>}
          </>
        ) : (
          <div className={styles.signIn}>
            <span className={styles.helper}>Sign in to leave a rating.</span>
            <Link href="/sign-in">Sign in</Link>
          </div>
        )}
      </div>

      {saving && <span className={styles.feedback} role="status">Saving your rating…</span>}
      {notice && <span className={styles.success} role="status">{notice}</span>}
      {error && <span className={styles.error} role="alert">{error}</span>}
    </section>
  );
}
