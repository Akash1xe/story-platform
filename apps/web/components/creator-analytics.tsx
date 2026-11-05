"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Bookmark,
  Clock3,
  LoaderCircle,
  RefreshCw,
  Users,
} from "lucide-react";
import { CreatorHeader } from "@/components/creator-workspace";
import {
  getCreatorAnalytics,
  type CreatorAnalyticsResponse,
} from "@/lib/creator-api";
import styles from "./creator-analytics.module.css";

function formatNumber(value: number) {
  return new Intl.NumberFormat().format(value);
}

function formatDate(value: string | null) {
  if (!value) return "Publication date unavailable";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

function formatStoryType(format: CreatorAnalyticsResponse["stories"][number]["format"]) {
  if (format === "COMIC") return "Comic";
  if (format === "SHORT_STORY") return "Short story";
  return "Novel";
}

export function CreatorAnalytics() {
  const [data, setData] = useState<CreatorAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    if (data) setRefreshing(true);
    else setLoading(true);
    setError("");

    getCreatorAnalytics()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : "Creator analytics could not be loaded.");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
      });

    return () => {
      active = false;
    };
  }, [refreshKey]);

  const maxReaders = Math.max(1, ...((data?.stories ?? []).map((story) => story.trackedReaders)));

  return (
    <>
      <CreatorHeader active="analytics" />
      <main className={styles.shell}>
        <Link className={styles.back} href="/creator"><ArrowLeft size={14} /> Back to Creator Studio</Link>

        <section className={styles.hero}>
          <div>
            <span className={styles.eyebrow}><BarChart3 size={13} /> CREATOR INSIGHTS</span>
            <h1>Your readership, at a glance.</h1>
            <p>Understand how signed-in readers are discovering and saving your published work.</p>
          </div>
          <div className={styles.heroIcon} aria-hidden="true"><Activity size={30} /></div>
        </section>

        <div className={styles.sectionHeading}>
          <div>
            <h2>Performance overview</h2>
            <p>{data ? `Updated ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(data.generatedAt))}` : "Your latest creator metrics"}</p>
          </div>
          <button className={styles.refresh} type="button" onClick={() => setRefreshKey((value) => value + 1)} disabled={loading || refreshing}>
            {refreshing ? <LoaderCircle size={14} className={styles.spinner} /> : <RefreshCw size={14} />}
            {refreshing ? "Updating…" : "Refresh"}
          </button>
        </div>

        {error && (
          <div className={styles.error} role="alert">
            <AlertCircle size={15} />
            <span>{error}</span>
            <button type="button" onClick={() => setRefreshKey((value) => value + 1)}>Try again</button>
          </div>
        )}

        {loading ? (
          <div className={styles.state}><LoaderCircle size={19} className={styles.spinner} /> Loading your analytics…</div>
        ) : data ? (
          <>
            <section className={styles.metrics} aria-label="Creator metrics">
              <article className={styles.metric}>
                <span className={styles.metricIcon}><Users size={17} /></span>
                <span className={styles.metricLabel}>Tracked reader accounts</span>
                <strong>{formatNumber(data.summary.trackedReaderAccounts)}</strong>
                <small>Signed-in accounts with saved reading progress</small>
              </article>
              <article className={styles.metric}>
                <span className={styles.metricIcon}><Activity size={17} /></span>
                <span className={styles.metricLabel}>Active in 30 days</span>
                <strong>{formatNumber(data.summary.activeReaderAccountsLast30Days)}</strong>
                <small>Accounts with a recent progress update</small>
              </article>
              <article className={styles.metric}>
                <span className={styles.metricIcon}><Bookmark size={17} /></span>
                <span className={styles.metricLabel}>Library saves</span>
                <strong>{formatNumber(data.summary.librarySaves)}</strong>
                <small>Times your published stories were saved</small>
              </article>
              <article className={styles.metric}>
                <span className={styles.metricIcon}><Users size={17} /></span>
                <span className={styles.metricLabel}>Followers</span>
                <strong>{formatNumber(data.summary.followers)}</strong>
                <small>Readers following your creator profile</small>
              </article>
              <article className={styles.metric}>
                <span className={styles.metricIcon}><BookOpen size={17} /></span>
                <span className={styles.metricLabel}>Published stories</span>
                <strong>{formatNumber(data.summary.publishedStories)}</strong>
                <small>Stories currently available to readers</small>
              </article>
            </section>

            <section className={styles.storySection}>
              <div className={styles.sectionHeading}>
                <div>
                  <h2>Story performance</h2>
                  <p>Ranked by accounts with saved reading progress.</p>
                </div>
                <span className={styles.topNote}>TOP {data.stories.length}</span>
              </div>

              {data.stories.length === 0 ? (
                <div className={styles.empty}>
                  <span><BookOpen size={25} /></span>
                  <h3>No published stories yet</h3>
                  <p>Once a story is approved and readers begin saving their progress, its metrics will appear here.</p>
                  <Link href="/creator" className={styles.primaryLink}>Open Creator Studio <ArrowUpRight size={14} /></Link>
                </div>
              ) : (
                <div className={styles.storyList}>
                  {data.stories.map((story, index) => {
                    const ratio = Math.max(5, Math.round((story.trackedReaders / maxReaders) * 100));
                    return (
                      <article className={styles.story} key={story.id}>
                        <span className={styles.rank}>{String(index + 1).padStart(2, "0")}</span>
                        <div className={styles.storyContent}>
                          <div className={styles.storyTitleRow}>
                            <div>
                              <h3>{story.title || "Untitled story"}</h3>
                              <span>{formatStoryType(story.format)} <span className={styles.dot}>·</span> Published {formatDate(story.publishedAt)}</span>
                            </div>
                            <Link href={"/stories/" + encodeURIComponent(story.slug)} className={styles.storyLink} aria-label={"View " + story.title}>
                              View <ArrowUpRight size={14} />
                            </Link>
                          </div>
                          <div className={styles.barTrack} aria-label={`${story.trackedReaders} tracked reader accounts`}>
                            <span style={{ width: ratio + "%" }} />
                          </div>
                          <div className={styles.storyStats}>
                            <span><Users size={13} /> <strong>{formatNumber(story.trackedReaders)}</strong> reader accounts</span>
                            <span><Bookmark size={13} /> <strong>{formatNumber(story.librarySaves)}</strong> saves</span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <p className={styles.disclaimer}>
              <Clock3 size={13} />
              These are account-based metrics from saved reading progress and library entries, not total page views. Anonymous reading and visits without saved progress are not counted.
            </p>
          </>
        ) : (
          <div className={styles.empty}>
            <span><BarChart3 size={25} /></span>
            <h3>Analytics are unavailable</h3>
            <p>We couldn't load your creator metrics. Try refreshing the page.</p>
            <button className={styles.primaryLink} type="button" onClick={() => setRefreshKey((value) => value + 1)}>Retry <RefreshCw size={14} /></button>
          </div>
        )}
      </main>
    </>
  );
}
