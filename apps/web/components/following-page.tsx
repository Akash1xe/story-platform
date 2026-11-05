"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen, Compass, LoaderCircle, UserRound, Users } from "lucide-react";
import { AuthNav } from "@/components/auth-nav";
import { listFollowedCreators, unfollowCreator, type FollowedCreator } from "@/lib/creator-follows";
import styles from "./following-page.module.css";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently followed";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function initials(name: string) {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join("");
}

export default function FollowingPage() {
  const [items, setItems] = useState<FollowedCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingCreator, setPendingCreator] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    listFollowedCreators()
      .then(result => { if (active) setItems(result.following); })
      .catch(reason => { if (active) setError(reason instanceof Error ? reason.message : "Could not load followed creators."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function handleUnfollow(creator: FollowedCreator["creator"]) {
    setPendingCreator(creator.id);
    setError("");
    try {
      await unfollowCreator(creator.creatorHandle ?? creator.id);
      setItems(current => current.filter(item => item.creator.id !== creator.id));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not unfollow this creator.");
    } finally {
      setPendingCreator(null);
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
          <nav className="desktop-nav" aria-label="Main navigation">
            <Link href="/">Home</Link>
            <Link href="/discover">Discover</Link>
            <Link href="/#genres">Genres</Link>
            <Link href="/library">My Library</Link>
            <Link className="nav-active" href="/following">Following</Link>
          </nav>
          <div className="header-actions"><AuthNav /></div>
        </div>
      </header>

      <main className={styles.shell}>
        <section className={styles.hero}>
          <div>
            <span className="eyebrow"><Users size={13} /> YOUR CREATOR NETWORK</span>
            <h1>Following</h1>
            <p>New stories and updates from the creators you care about.</p>
          </div>
          <div className={styles.heroIcon}><Users size={25} /></div>
        </section>

        <div className={styles.sectionHeading}>
          <div>
            <h2>Your creators</h2>
            <p>{loading ? "Loading your following list…" : items.length + (items.length === 1 ? " creator followed" : " creators followed")}</p>
          </div>
          <Link className={styles.discoverLink} href="/discover">Discover creators <ArrowRight size={14} /></Link>
        </div>

        {error && items.length > 0 && <p className={styles.error} role="alert">{error}</p>}

        {loading ? (
          <div className={styles.state}><LoaderCircle className={styles.spinner} size={20} /> Loading your creators…</div>
        ) : items.length ? (
          <div className={styles.list}>
            {items.map(({ followedAt, creator }) => {
              const creatorPath = creator.creatorHandle ?? creator.id;
              return (
                <article className={styles.card} key={creator.id}>
                  <div className={styles.cardHeader}>
                    <Link className={styles.avatar} href={"/creators/" + encodeURIComponent(creatorPath)} aria-label={"View " + creator.displayName + "'s profile"}>
                      {creator.avatarUrl ? <img src={creator.avatarUrl} alt="" /> : <span>{initials(creator.displayName) || <UserRound size={24} />}</span>}
                    </Link>
                    <div className={styles.identity}>
                      <Link className={styles.name} href={"/creators/" + encodeURIComponent(creatorPath)}>{creator.displayName}</Link>
                      {creator.creatorHandle && <span className={styles.handle}>@{creator.creatorHandle}</span>}
                      <p>{creator.creatorBio || "StoryWorld creator"}</p>
                      <div className={styles.meta}><span>{creator.followersCount.toLocaleString()} followers</span><span>Following since {formatDate(followedAt)}</span></div>
                    </div>
                    <div className={styles.actions}>
                      <Link className={styles.profileLink} href={"/creators/" + encodeURIComponent(creatorPath)}>Profile <ArrowUpRight size={13} /></Link>
                      <button type="button" className={styles.unfollow} disabled={pendingCreator === creator.id} onClick={() => void handleUnfollow(creator)}>
                        {pendingCreator === creator.id ? <LoaderCircle className={styles.spinner} size={13} /> : null}
                        {pendingCreator === creator.id ? "Removing…" : "Unfollow"}
                      </button>
                    </div>
                  </div>

                  <div className={styles.latest}>
                    <div className={styles.latestHeading}><span>RECENTLY PUBLISHED</span>{creator.stories.length > 0 && <span>{creator.stories.length} recent {creator.stories.length === 1 ? "story" : "stories"}</span>}</div>
                    {creator.stories.length ? (
                      <div className={styles.storyList}>
                        {creator.stories.map(story => (
                          <Link className={styles.story} href={"/stories/" + story.slug} key={story.id}>
                            <span className={styles.storyCover} style={story.coverImageUrl ? { backgroundImage: "url('" + story.coverImageUrl + "')" } : undefined}><BookOpen size={15} /></span>
                            <span className={styles.storyTitle}>{story.title}</span>
                            <ArrowUpRight size={14} />
                          </Link>
                        ))}
                      </div>
                    ) : <p className={styles.noStories}>No published stories are available right now.</p>}
                  </div>
                </article>
              );
            })}
          </div>
        ) : error ? (
          <div className={styles.state} role="alert">{error}</div>
        ) : (
          <div className={styles.empty}>
            <span><Users size={25} /></span>
            <h3>Your creator list starts here</h3>
            <p>Follow creators from their public profiles and their latest published stories will appear here.</p>
            <Link className={styles.emptyAction} href="/discover"><Compass size={15} /> Explore stories <ArrowRight size={14} /></Link>
          </div>
        )}
      </main>
    </>
  );
}
