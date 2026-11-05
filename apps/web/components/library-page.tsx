"use client";
import Link from "next/link";
import { ArrowRight, Bookmark, Clock3, Compass, LibraryBig } from "lucide-react";
import StoryCard from "@/components/story-card";
import { SiteHeader } from "@/components/site-header";
import NotificationBell from "@/components/notification-bell";
import { useReaderLibrary } from "@/hooks/use-reader-library";
import ReadingListsPanel from "@/components/reading-lists-panel";

function formatLastRead(timestamp: number): string {
  if (!timestamp) return "Reading activity saved";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(timestamp);
}
export default function LibraryPage() {
  const { library, isReady, isAuthenticated, error } = useReaderLibrary();
  return (
    <>
            <SiteHeader
        active="library"
        actions={
          <>
            <NotificationBell />
            <Link href="/discover" className="creator-button"><Compass size={14} /> Discover stories</Link>
          </>
        }
      />
      <main className="library-shell">
        <div className="library-heading"><div><span className="eyebrow">YOUR PERSONAL SPACE</span><h1>My Library</h1><p>Your saved stories and reading progress, synced to your account.</p></div><div className="library-heading-icon"><LibraryBig size={25} /></div></div>
        {!isReady ? <div className="library-loading" aria-live="polite">Loading your library…</div> : !isAuthenticated ? (
          <div className="library-empty"><Bookmark size={23} /><h3>Your library lives with your account</h3><p>Sign in to save stories and keep your reading progress across devices.</p><Link className="button-primary" href="/sign-in?next=%2Flibrary">Sign in to your library <ArrowRight size={15} /></Link></div>
        ) : (
          <>
            {error && <p className="library-inline-error" role="alert">{error}</p>}
            <ReadingListsPanel />
            <section className="library-section">
              <div className="library-section-heading"><div><span className="eyebrow">PICK UP WHERE YOU LEFT OFF</span><h2>Continue reading</h2></div><span className="library-count">{library.continueReading.length} {library.continueReading.length === 1 ? "story" : "stories"}</span></div>
              {library.continueReading.length ? (
                <div className="continue-list">{library.continueReading.map((record) => (
                  <article className="continue-item" key={record.story.id}>
                    <Link className="continue-cover" href={`/stories/${record.story.id}/read/${record.chapterNumber}`} style={{ backgroundImage: `url("${record.story.coverImage}")` }} aria-label={`Continue reading ${record.story.title}`} />
                    <div className="continue-copy"><span>{record.story.type} · {record.story.genre}</span>
                      <h3><Link href={`/stories/${record.story.id}/read/${record.chapterNumber}`}>{record.story.title}</Link></h3>
                      <p>Chapter {record.chapterNumber}: {record.chapterTitle}</p>
                      <div className="library-progress-track" role="progressbar" aria-label={`Reading progress for chapter ${record.chapterNumber} of ${record.story.title}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={record.percent}><span style={{ width: `${record.percent}%` }} /></div>
                      <small>{record.percent}% through chapter · {formatLastRead(record.updatedAt)}</small>
                    </div>
                    <Link className="continue-action" href={`/stories/${record.story.id}/read/${record.chapterNumber}`}>Continue <ArrowRight size={15} /></Link>
                  </article>
                ))}</div>
              ) : <div className="library-empty library-empty--compact"><Clock3 size={21} /><div><h3>No reading in progress</h3><p>Open a published chapter and your progress will appear here.</p></div><Link href="/discover">Find a story <ArrowRight size={14} /></Link></div>}
            </section>
            <section className="library-section">
              <div className="library-section-heading"><div><span className="eyebrow">KEEP THEM CLOSE</span><h2>Saved stories</h2></div><span className="library-count">{library.savedStories.length} {library.savedStories.length === 1 ? "saved story" : "saved stories"}</span></div>
              {library.savedStories.length ? <div className="story-grid">{library.savedStories.map((story) => <StoryCard key={story.id} story={story} />)}</div> : (
                <div className="library-empty"><Bookmark size={23} /><h3>Your library is waiting for its first story</h3><p>Use the bookmark icon on any published story card to save it here.</p><Link className="button-primary" href="/discover">Explore stories <ArrowRight size={15} /></Link></div>
              )}
            </section>
          </>
        )}
      </main>
    </>
  );
}
