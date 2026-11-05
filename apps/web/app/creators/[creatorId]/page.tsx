import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, CalendarDays, Layers3, PenLine, Sparkles } from "lucide-react";
import StoryCard from "@/components/story-card";
import { CreatorFollowButton } from "@/components/creator-follow-button";
import { getPublicCreator, toCatalogStory } from "@/lib/public-stories";
import profileStyles from "./profile.module.css";

type PageProps = { params: Promise<{ creatorId: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { creatorId } = await params;
  const result = await getPublicCreator(creatorId);
  if (!result) return { title: "Creator not found | StoryWorld" };
  const { creator } = result;
  return {
    title: `${creator.displayName} | StoryWorld Creator`,
    description: `Discover published stories by ${creator.displayName} on StoryWorld.`,
    openGraph: { title: `${creator.displayName} | StoryWorld` },
  };
}

export default async function PublicCreatorPage({ params }: PageProps) {
  const { creatorId } = await params;
  const result = await getPublicCreator(creatorId);
  if (!result) notFound();

  const { creator } = result;
  const stories = creator.stories.map(toCatalogStory);
  const comicCount = stories.filter((story) => story.type === "Comic").length;
  const novelCount = stories.filter((story) => story.type === "Novel").length;
  const shortStoryCount = stories.filter((story) => story.type === "Short story").length;
  const joinedDate = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(new Date(creator.joinedAt));
  const initials = creator.displayName.trim().split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");

  return <>
    <header className="site-header">
      <div className="header-inner detail-header-inner">
        <Link href="/" className="brand"><span className="brand-icon"><BookOpen size={20} /></span><span>StoryWorld<span className="brand-period">.</span></span></Link>
        <Link href="/discover" className="detail-back-link"><ArrowLeft size={15} />Back to stories</Link>
      </div>
    </header>
    <main className="creator-profile-shell">
      <nav className="detail-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/discover">Discover</Link><span>/</span><span>Creator</span></nav>
      <section className="creator-profile-hero">
        <div className="creator-profile-avatar">
          {creator.avatarUrl ? <img src={creator.avatarUrl} alt={creator.displayName} /> : <span>{initials || <PenLine size={30} />}</span>}
        </div>
        <div className="creator-profile-copy">
          <span className="eyebrow"><Sparkles size={13} />STORYWORLD CREATOR</span>
          <h1>{creator.displayName}</h1>
          {creator.handle && <p className={profileStyles.handle}>@{creator.handle}</p>}
          <p>{creator.bio || "Independent creator sharing original stories on StoryWorld."}</p>
          {creator.websiteUrl && <a className={profileStyles.website} href={creator.websiteUrl} target="_blank" rel="noreferrer noopener">Visit creator website</a>}
          <CreatorFollowButton creatorId={creator.id} initialFollowersCount={creator.followersCount} />
          <div className="creator-profile-meta"><span><CalendarDays size={14} /> On StoryWorld since {joinedDate}</span><span><BookOpen size={14} /> {stories.length} published {stories.length === 1 ? "story" : "stories"}</span></div>
        </div>
        <div className="creator-profile-mark"><PenLine size={25} /><span>CREATOR<br />PROFILE</span></div>
      </section>
      <section className="creator-profile-stats" aria-label="Published story formats">
        <article><span>Published works</span><strong>{stories.length}</strong></article>
        <article><span>Comics</span><strong>{comicCount}</strong></article>
        <article><span>Novels</span><strong>{novelCount}</strong></article>
        <article><span>Short stories</span><strong>{shortStoryCount}</strong></article>
      </section>
      <section className="creator-profile-works">
        <div className="section-heading">
          <div><span className="eyebrow">THE CREATOR'S CATALOG</span><h2>Published stories</h2><p>Only approved and published work appears on this page.</p></div>
          <span className="creator-profile-total"><Layers3 size={15} />{stories.length} works</span>
        </div>
        {stories.length ? <div className="story-grid">{stories.map((story) => <StoryCard key={story.id} story={story} />)}</div> : <p className="empty-message">This creator has no published stories yet.</p>}
      </section>
    </main>
  </>;
}
