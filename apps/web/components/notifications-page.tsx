"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Bell, CheckCheck, Circle, LoaderCircle } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { AuthNav } from "@/components/auth-nav";
import styles from "./notifications-page.module.css";

type NotificationRecord = {
  id: string;
  type: "NEW_STORY";
  readAt: string | null;
  createdAt: string;
  story: {
    slug: string;
    title: string;
    coverImageUrl: string | null;
    author: { displayName: string; creatorHandle: string | null };
  };
};

type NotificationResponse = {
  notifications: NotificationRecord[];
  unreadCount: number;
  pagination: { page: number; limit: number; total: number; hasMore: boolean };
};

async function errorMessage(response: Response, fallback: string) {
  try {
    const result = await response.json() as { error?: { message?: string } };
    return result.error?.message ?? fallback;
  } catch {
    return fallback;
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void fetch("/api/v1/notifications?limit=20", {
      credentials: "include",
      cache: "no-store",
      headers: { Accept: "application/json" },
    }).then(async (response) => {
      if (!response.ok) throw new Error(await errorMessage(response, "Notifications could not be loaded."));
      return await response.json() as NotificationResponse;
    }).then((result) => {
      if (!active) return;
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
      setPage(result.pagination.page);
      setHasMore(result.pagination.hasMore);
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "Notifications could not be loaded.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  async function markAsRead(notificationId: string) {
    const item = notifications.find((notification) => notification.id === notificationId);
    if (!item || item.readAt || pendingId) return;
    setPendingId(notificationId);
    setError("");
    try {
      const response = await fetch("/api/v1/notifications/" + encodeURIComponent(notificationId) + "/read", {
        method: "PATCH",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error(await errorMessage(response, "This notification could not be updated."));
      const readAt = new Date().toISOString();
      setNotifications((current) => current.map((notification) =>
        notification.id === notificationId ? { ...notification, readAt } : notification
      ));
      setUnreadCount((current) => Math.max(0, current - 1));
      window.dispatchEvent(new Event("storyworld:notifications-updated"));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "This notification could not be updated.");
    } finally {
      setPendingId(null);
    }
  }

  async function markAllAsRead() {
    if (unreadCount === 0 || markingAll) return;
    setMarkingAll(true);
    setError("");
    try {
      const response = await fetch("/api/v1/notifications/read-all", {
        method: "PATCH",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error(await errorMessage(response, "Notifications could not be updated."));
      const readAt = new Date().toISOString();
      setNotifications((current) => current.map((notification) =>
        notification.readAt ? notification : { ...notification, readAt }
      ));
      setUnreadCount(0);
      window.dispatchEvent(new Event("storyworld:notifications-updated"));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Notifications could not be updated.");
    } finally {
      setMarkingAll(false);
    }
  }

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setError("");
    try {
      const response = await fetch("/api/v1/notifications?page=" + (page + 1) + "&limit=20", {
        credentials: "include",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error(await errorMessage(response, "More notifications could not be loaded."));
      const result = await response.json() as NotificationResponse;
      setNotifications((current) => [...current, ...result.notifications]);
      setPage(result.pagination.page);
      setHasMore(result.pagination.hasMore);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "More notifications could not be loaded.");
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <>
            <SiteHeader brandIcon={<Bell size={19} />} actions={<AuthNav />} />

      <main className={styles.shell}>
        <Link className={styles.back} href="/"><ArrowLeft size={14} /> Back to StoryWorld</Link>
        <div className={styles.titleRow}>
          <div>
            <span className={styles.eyebrow}>YOUR ACTIVITY</span>
            <h1>Notifications</h1>
            <p>Updates when creators you follow publish new stories.</p>
          </div>
          <div className={styles.titleIcon}><Bell size={24} /></div>
        </div>

        <div className={styles.listHeader}>
          <div><strong>Recent updates</strong><span>{unreadCount} unread</span></div>
          <button type="button" onClick={() => void markAllAsRead()} disabled={unreadCount === 0 || markingAll}>
            <CheckCheck size={14} /> {markingAll ? "Updating…" : "Mark all as read"}
          </button>
        </div>

        {error && <p className={styles.error} role="alert">{error}</p>}

        {loading ? (
          <div className={styles.loading}><LoaderCircle size={18} /> Loading notifications…</div>
        ) : notifications.length === 0 ? (
          <div className={styles.empty}>
            <span><Bell size={22} /></span>
            <h2>You’re all caught up</h2>
            <p>When a creator you follow publishes a story, you’ll find the update here.</p>
            <Link href="/discover">Discover creators and stories <ArrowRight size={15} /></Link>
          </div>
        ) : (
          <div className={styles.list}>
            {notifications.map((notification) => {
              const isUnread = !notification.readAt;
              return (
                <article className={isUnread ? styles.itemUnread : styles.item} key={notification.id}>
                  <div className={styles.cover}>
                    {notification.story.coverImageUrl
                      ? <img src={notification.story.coverImageUrl} alt="" />
                      : <span>{notification.story.author.displayName.trim().charAt(0).toUpperCase() || "S"}</span>}
                  </div>
                  <div className={styles.copy}>
                    <div className={styles.meta}>
                      <span className={styles.event}><Circle size={7} fill="currentColor" /> NEW STORY</span>
                      <time dateTime={notification.createdAt}>{formatDate(notification.createdAt)}</time>
                    </div>
                    <h2><Link href={"/stories/" + notification.story.slug} onClick={() => void markAsRead(notification.id)}>{notification.story.title}</Link></h2>
                    <p><strong>{notification.story.author.displayName}</strong> published a new story.</p>
                    <div className={styles.actions}>
                      <Link href={"/stories/" + notification.story.slug} onClick={() => void markAsRead(notification.id)}>Read story <ArrowRight size={14} /></Link>
                      {isUnread && (
                        <button type="button" onClick={() => void markAsRead(notification.id)} disabled={pendingId === notification.id}>
                          {pendingId === notification.id ? "Updating…" : "Mark as read"}
                        </button>
                      )}
                    </div>
                  </div>
                  {isUnread && <span className={styles.unreadDot} aria-label="Unread" />}
                </article>
              );
            })}
          </div>
        )}

        {hasMore && !loading && (
          <button className={styles.loadMore} type="button" onClick={() => void loadMore()} disabled={loadingMore}>
            {loadingMore ? "Loading…" : "Load older notifications"}
          </button>
        )}
      </main>
    </>
  );
}
