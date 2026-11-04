"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, LoaderCircle, UserPlus } from "lucide-react";
import styles from "./creator-follow-button.module.css";

type Props = { creatorId: string; initialFollowersCount: number };
export function CreatorFollowButton({ creatorId, initialFollowersCount }: Props) {
  const [following, setFollowing] = useState(false);
  const [count, setCount] = useState(initialFollowersCount);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signedOut, setSignedOut] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch(`/api/v1/following/${encodeURIComponent(creatorId)}`, { credentials: "include", cache: "no-store" })
      .then(async response => {
        if (response.status === 401) { if (active) setSignedOut(true); return null; }
        if (!response.ok) throw new Error("Could not load follow status.");
        return response.json() as Promise<{ following: boolean }>;
      })
      .then(result => { if (active && result) setFollowing(result.following); })
      .catch(reason => { if (active) setError(reason instanceof Error ? reason.message : "Could not load follow status."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [creatorId]);

  async function toggle() {
    setSaving(true); setError("");
    try {
      const response = await fetch(`/api/v1/following/${encodeURIComponent(creatorId)}`, {
        method: following ? "DELETE" : "POST", credentials: "include",
      });
      const result = await response.json() as { following?: boolean; followersCount?: number; error?: { message?: string } };
      if (!response.ok) throw new Error(result.error?.message ?? "Could not update follow.");
      setFollowing(Boolean(result.following));
      setCount(result.followersCount ?? count);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not update follow."); }
    finally { setSaving(false); }
  }

  return <div className={styles.wrap}>
    {signedOut ? <Link className={styles.button} href={`/sign-in?callbackURL=${encodeURIComponent(`/creators/${creatorId}`)}`}><UserPlus size={14}/>Sign in to follow</Link> :
      <button className={following ? styles.following : styles.button} onClick={toggle} disabled={loading || saving} type="button">
        {loading || saving ? <LoaderCircle className={styles.spinner} size={14}/> : following ? <Check size={14}/> : <UserPlus size={14}/>}
        {loading ? "Loading…" : saving ? "Saving…" : following ? "Following" : "Follow creator"}
      </button>}
    <span className={styles.count}>{count.toLocaleString()} followers</span>
    {error && <span className={styles.error} role="alert">{error}</span>}
  </div>;
}
