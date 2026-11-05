"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { MessageCircle, Pencil, Send, Trash2, X } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import styles from "./chapter-comments.module.css";

type ChapterCommentRecord = {
  id: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    creatorHandle: string | null;
  };
};

type ChapterCommentsProps = { slug: string; chapterNumber: number };
type CommentResponse = {
  comments: ChapterCommentRecord[];
  pagination: { page: number; limit: number; total: number; hasMore: boolean };
};

async function responseMessage(response: Response, fallback: string) {
  try {
    const result = await response.json() as { error?: { message?: string } };
    return result.error?.message ?? fallback;
  } catch {
    return fallback;
  }
}

function formatCommentDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function ChapterComments({ slug, chapterNumber }: ChapterCommentsProps) {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const [comments, setComments] = useState<ChapterCommentRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [posting, setPosting] = useState(false);
  const [body, setBody] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const commentsUrl = "/api/v1/stories/" + encodeURIComponent(slug) + "/chapters/" + chapterNumber + "/comments";

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    void fetch(commentsUrl, {
      credentials: "include",
      cache: "no-store",
      headers: { Accept: "application/json" },
    }).then(async (response) => {
      if (!response.ok) throw new Error(await responseMessage(response, "Comments could not be loaded."));
      return await response.json() as CommentResponse;
    }).then((result) => {
      if (!active) return;
      setComments(result.comments);
      setTotal(result.pagination.total);
      setPage(result.pagination.page);
      setHasMore(result.pagination.hasMore);
    }).catch((loadError: unknown) => {
      if (active) setError(loadError instanceof Error ? loadError.message : "Comments could not be loaded.");
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => { active = false; };
  }, [commentsUrl]);

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || posting) return;
    setPosting(true);
    setError(null);
    try {
      const response = await fetch(commentsUrl, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ body: trimmed }),
      });
      if (!response.ok) throw new Error(await responseMessage(response, "Your comment could not be posted."));
      const result = await response.json() as { comment: ChapterCommentRecord };
      setComments((current) => [result.comment, ...current]);
      setTotal((current) => current + 1);
      setBody("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Your comment could not be posted.");
    } finally {
      setPosting(false);
    }
  }

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setError(null);
    try {
      const response = await fetch(commentsUrl + "?page=" + (page + 1) + "&limit=20", {
        credentials: "include",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error(await responseMessage(response, "More comments could not be loaded."));
      const result = await response.json() as CommentResponse;
      setComments((current) => [...current, ...result.comments]);
      setPage(result.pagination.page);
      setHasMore(result.pagination.hasMore);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "More comments could not be loaded.");
    } finally {
      setLoadingMore(false);
    }
  }

  function startEdit(comment: ChapterCommentRecord) {
    setEditingId(comment.id);
    setEditBody(comment.body);
    setError(null);
  }

  async function saveEdit(commentId: string) {
    const trimmed = editBody.trim();
    if (!trimmed || savingEdit) return;
    setSavingEdit(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/chapter-comments/" + encodeURIComponent(commentId), {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ body: trimmed }),
      });
      if (!response.ok) throw new Error(await responseMessage(response, "Your edit could not be saved."));
      const result = await response.json() as { comment: ChapterCommentRecord };
      setComments((current) => current.map((item) => item.id === commentId ? result.comment : item));
      setEditingId(null);
      setEditBody("");
    } catch (editError) {
      setError(editError instanceof Error ? editError.message : "Your edit could not be saved.");
    } finally {
      setSavingEdit(false);
    }
  }

  async function deleteComment(commentId: string) {
    if (deletingId) return;
    if (!window.confirm("Delete this comment? This cannot be undone.")) return;
    setDeletingId(commentId);
    setError(null);
    try {
      const response = await fetch("/api/v1/chapter-comments/" + encodeURIComponent(commentId), {
        method: "DELETE",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error(await responseMessage(response, "Your comment could not be deleted."));
      setComments((current) => current.filter((item) => item.id !== commentId));
      setTotal((current) => Math.max(0, current - 1));
      if (editingId === commentId) setEditingId(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Your comment could not be deleted.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className={styles.section} aria-labelledby="chapter-comments-heading">
      <div className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>READER DISCUSSION</span>
          <h2 id="chapter-comments-heading"><MessageCircle size={20} /> Chapter comments <span>{total}</span></h2>
          <p>Share your thoughts about chapter {chapterNumber}.</p>
        </div>
      </div>

      {error && <p className={styles.error} role="alert">{error}</p>}

      {sessionPending ? (
        <div className={styles.formNotice}>Checking your account…</div>
      ) : session ? (
        <form className={styles.form} onSubmit={submitComment}>
          <label htmlFor="chapter-comment-body">Add to the discussion</label>
          <textarea
            id="chapter-comment-body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="What did you think of this chapter?"
            maxLength={1500}
            rows={3}
            required
          />
          <div className={styles.formFooter}>
            <span>{body.length}/1500</span>
            <button type="submit" disabled={posting || !body.trim()}>
              <Send size={14} /> {posting ? "Posting…" : "Post comment"}
            </button>
          </div>
        </form>
      ) : (
        <div className={styles.signInNotice}>
          <p>Join the discussion by signing in to your StoryWorld account.</p>
          <Link href="/sign-in">Sign in to comment</Link>
        </div>
      )}

      <div className={styles.list} aria-live="polite">
        {loading ? (
          <p className={styles.empty}>Loading comments…</p>
        ) : comments.length === 0 ? (
          <p className={styles.empty}>No comments yet. Start the conversation.</p>
        ) : comments.map((comment) => {
          const isAuthor = session?.user.id === comment.author.id;
          return (
            <article className={styles.comment} key={comment.id}>
              <div className={styles.avatar}>
                {comment.author.avatarUrl
                  ? <img src={comment.author.avatarUrl} alt="" />
                  : <span>{comment.author.displayName.trim().charAt(0).toUpperCase() || "R"}</span>}
              </div>
              <div className={styles.commentContent}>
                <div className={styles.commentMeta}>
                  <div>
                    <strong>{comment.author.displayName}</strong>
                    {comment.author.creatorHandle && <span>@{comment.author.creatorHandle}</span>}
                    <time dateTime={comment.createdAt}>{formatCommentDate(comment.createdAt)}</time>
                    {comment.updatedAt !== comment.createdAt && <small>Edited</small>}
                  </div>
                  {isAuthor && editingId !== comment.id && (
                    <div className={styles.actions}>
                      <button type="button" aria-label="Edit comment" onClick={() => startEdit(comment)}><Pencil size={14} /></button>
                      <button type="button" aria-label="Delete comment" disabled={deletingId === comment.id} onClick={() => void deleteComment(comment.id)}><Trash2 size={14} /></button>
                    </div>
                  )}
                </div>

                {editingId === comment.id ? (
                  <div className={styles.editForm}>
                    <textarea value={editBody} onChange={(event) => setEditBody(event.target.value)} maxLength={1500} rows={3} aria-label="Edit your comment" />
                    <div>
                      <button type="button" className={styles.cancelButton} onClick={() => setEditingId(null)}><X size={13} /> Cancel</button>
                      <button type="button" disabled={savingEdit || !editBody.trim()} onClick={() => void saveEdit(comment.id)}><Pencil size={13} /> {savingEdit ? "Saving…" : "Save edit"}</button>
                    </div>
                  </div>
                ) : (
                  <p className={styles.commentBody}>{comment.body}</p>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {hasMore && !loading && (
        <button className={styles.loadMore} type="button" onClick={() => void loadMore()} disabled={loadingMore}>
          {loadingMore ? "Loading…" : "Load older comments"}
        </button>
      )}
    </section>
  );
}
