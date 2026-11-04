"use client";
import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Bookmark, Clock3, Compass, LibraryBig } from "lucide-react";
import StoryCard from "@/components/story-card";
import { allStories } from "@/lib/demo-content";
import { useReaderLibrary } from "@/hooks/use-reader-library";

function formatLastRead(timestamp: number): string {
  if (!timestamp) return "Reading activity saved";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(timestamp);
}

export default function LibraryPage() {
  const { library, isReady } = useReaderLibrary();
  const savedStories = useMemo(
    () => allStories.filter((story) => library.savedStoryIds.includes(story.id)),
    [library.savedStoryIds]
  );
  const continueReading = useMemo(
    () => allStories
      .filter((story) => {
        const percent = library.progress[story.id]?.percent ?? 0;
        return percent > 0 && percent < 100;
      })
      .sort((a, b) => (library.progress[b.id]?.updatedAt ?? 0) - (library.progress[a.id]?.updatedAt ?? 0)),
    [library.progress]
  );

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
            <Link href="/#discover">Discover</Link>
            <Link href="/#genres">Genres</Link>
            <Link className="nav-active" href="/library">My Library</Link>
          </nav>
          <div className="header-actions">
            <Link href="/#collection" className="creator-button"><Compass size={14} /> Discover stories</Link>
          </div>
        </div>
      </header>
      <main className="library-shell">
        <div className="library-heading">
          <div>
            <span className="eyebrow">YOUR PERSONAL SPACE</span>
            <h1>My Library</h1>
            <p>Your saved stories and reading progress, together in one place.</p>
          </div>
          <div className="library-heading-icon"><LibraryBig size={25} /></div>
        </div>
        <div className="library-local-note">
          <Bookmark size={14} />
          Saved on this device only · Sign-in and cloud sync will be added later
        </div>
        {!isReady ? (
          <div className="library-loading" aria-live="polite">Loading your library…</div>
        ) : (
          <>
            <section className="library-section">
              <div className="library-section-heading">
                <div><span className="eyebrow">PICK UP WHERE YOU LEFT OFF</span><h2>Continue reading</h2></div>
                <span className="library-count">{continueReading.length} {continueReading.length === 1 ? "story" : "stories"}</span>
              </div>
              {continueReading.length ? (
                <div className="continue-list">
                  {continueReading.map((story) => {
                    const record = library.progress[story.id];
                    const percent = record?.percent ?? 0;
                    return (
                      <article className="continue-item" key={story.id}>
                        <Link
                          className="continue-cover"
                          href={`/stories/${story.id}/read`}
                          style={{ backgroundImage: `url("${story.coverImage}")` }}
                          aria-label={`Continue reading ${story.title}`}
                        />
                        <div className="continue-copy">
                          <span>{story.type} · {story.genre}</span>
                          <h3><Link href={`/stories/${story.id}/read`}>{story.title}</Link></h3>
                          <p>by {story.creator}</p>
                          <div className="library-progress-track" role="progressbar" aria-label={`Reading progress for ${story.title}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
                            <span style={{ width: `${percent}%` }} />
                          </div>
                          <small>{percent}% read · {formatLastRead(record?.updatedAt ?? 0)}</small>
                        </div>
                        <Link className="continue-action" href={`/stories/${story.id}/read`}>Continue <ArrowRight size={15} /></Link>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="library-empty library-empty--compact">
                  <Clock3 size={21} />
                  <div><h3>No reading in progress</h3><p>Open a story and your reading progress will appear here.</p></div>
                  <Link href="/#collection">Find a story <ArrowRight size={14} /></Link>
                </div>
              )}
            </section>
            <section className="library-section">
              <div className="library-section-heading">
                <div><span className="eyebrow">KEEP THEM CLOSE</span><h2>Saved stories</h2></div>
                <span className="library-count">{savedStories.length} {savedStories.length === 1 ? "saved story" : "saved stories"}</span>
              </div>
              {savedStories.length ? (
                <div className="story-grid">{savedStories.map((story) => <StoryCard key={story.id} story={story} />)}</div>
              ) : (
                <div className="library-empty">
                  <Bookmark size={23} />
                  <h3>Your library is waiting for its first story</h3>
                  <p>Use the bookmark icon on any story card to save it here.</p>
                  <Link className="button-primary" href="/#collection">Explore stories <ArrowRight size={15} /></Link>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </>
  );
}
