"use client";
import Link from "next/link";
import { useReaderLibrary } from "@/hooks/use-reader-library";
import { ArrowUpRight, Bookmark, Clock3 } from "lucide-react";
import type { Story } from "@/lib/demo-content";

type StoryCardProps = { story: Story };
export default function StoryCard({ story }: StoryCardProps) {
  const { library, isReady, isSaving, toggleSavedStory, error } = useReaderLibrary();
  const saved = library.savedStoryIds.includes(story.id);
  return (
    <article className="story-card">
      <div className="story-cover" style={{ backgroundImage: "url('" + story.coverImage + "')" }}>
        <Link href={`/stories/${story.id}`} className="story-cover-link" aria-label={`View details for ${story.title}`}>
          <span className="cover-type">{story.type}</span><div className="cover-gradient" />
          <div className="cover-caption"><span>{story.genre}</span><h3>{story.title}</h3></div>
        </Link>
        {story.isPublished && (
          <button type="button" className={"save-button" + (saved ? " is-saved" : "")}
            aria-label={saved ? `Remove ${story.title} from My Library` : `Save ${story.title} to My Library`}
            aria-pressed={saved} disabled={!isReady || isSaving} onClick={() => void toggleSavedStory(story.id)}>
            <Bookmark size={16} fill={saved ? "currentColor" : "none"} />
          </button>
        )}
      </div>
      <div className="story-info">
        {story.creatorId
          ? <Link className="story-creator" href={`/creators/${story.creatorId}`}>by {story.creator}</Link>
          : <span className="story-creator">by {story.creator}</span>}
        <p>{story.description}</p>
        <div className="story-meta"><span><Clock3 size={13} />{story.minutes} min read</span><span>{story.type}</span></div>
        <Link className="story-detail-link" href={`/stories/${story.id}`}>View story <ArrowUpRight size={13} aria-hidden="true" /></Link>
        {error && <small role="alert" className="library-inline-error">{error}</small>}
      </div>
    </article>
  );
}
