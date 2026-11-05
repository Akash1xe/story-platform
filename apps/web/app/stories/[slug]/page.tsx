import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Clock3, Feather, Layers3, Sparkles } from "lucide-react";
import { getPublicStory } from "@/lib/public-stories";
import ContentReportButton from "@/components/content-report-button";
import StoryRating from "@/components/story-rating";
import AddToReadingListButton from "@/components/add-to-reading-list-button";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPublicStory(slug);
  if (!result) return { title: "Story not found | StoryWorld" };
  const { story } = result;
  return {
    title: `${story.title} | StoryWorld`,
    description: story.synopsis,
    openGraph: { title: story.title, description: story.synopsis, images: story.coverImageUrl ? [story.coverImageUrl] : [] },
  };
}

export default async function StoryDetailsPage({ params }: PageProps) {
  const { slug } = await params;
  const result = await getPublicStory(slug);
  if (!result) notFound();
  const { story } = result;
  const format = story.format === "COMIC" ? "Comic" : story.format === "NOVEL" ? "Novel" : "Short story";
  const genre = story.genres[0]?.genre.name ?? "Uncategorised";
  const firstChapter = story.chapters[0];
  const coverStyle = story.coverImageUrl ? { backgroundImage: `url("${story.coverImageUrl}")` } : undefined;

  return <>
    <header className="site-header"><div className="header-inner detail-header-inner">
      <Link href="/" className="brand"><span className="brand-icon"><BookOpen size={20} /></span><span>StoryWorld<span className="brand-period">.</span></span></Link>
      <Link href="/discover" className="detail-back-link"><ArrowLeft size={15} />Back to stories</Link>
    </div></header>
    <main className="story-detail-shell">
      <nav className="detail-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/discover">Discover</Link><span>/</span><span>{story.title}</span></nav>
      <section className="story-detail-hero" aria-labelledby="story-title">
        <div className="story-detail-cover" style={coverStyle} role="img" aria-label={`Cover artwork for ${story.title}`}>
          <span className="detail-preview-stamp">PUBLISHED STORY</span>
        </div>
        <div className="story-detail-copy">
          <div className="detail-eyebrow"><Sparkles size={13} />STORYWORLD PUBLICATION</div>
          <div className="detail-type-line">{format} <span>·</span> {genre}</div>
          <h1 id="story-title">{story.title}</h1>
          <p className="detail-byline">Created by <Link href={`/creators/${story.author.id}`}>{story.author.displayName}</Link></p>
          <p className="detail-description">{story.synopsis}</p>
          <div className="detail-tag-list"><span><Layers3 size={13} />{format}</span><span><Clock3 size={13} />{story.chapters.length} chapters</span><span><CheckCircle2 size={13} />{story.publicationStatus === "COMPLETED" ? "Completed" : "Ongoing"}</span></div>
          <StoryRating slug={story.slug} ownerId={story.author.id} />
          {firstChapter && <div className="detail-actions">
            <Link className="button-primary" href={`/stories/${story.slug}/read/${firstChapter.number}`}>Start reading <ArrowRight size={16} /></Link>
            <Link className="button-secondary" href="/discover">Explore more stories</Link>
            <AddToReadingListButton storySlug={story.slug} />
            <ContentReportButton targetType="STORY" targetId={story.id} ownerId={story.author.id} />
          </div>}
        </div>
      </section>
      <section className="public-chapter-section">
        <div className="detail-section-heading"><div><span className="eyebrow">READ THE STORY</span><h2>Chapters and episodes</h2><p>Choose where you want to begin.</p></div><span className="preview-reading-time">{story.chapters.length} total</span></div>
        <div className="public-chapter-list">
          {story.chapters.map((chapter) => <Link className="public-chapter-link" key={chapter.id} href={`/stories/${story.slug}/read/${chapter.number}`}>
            <span className="public-chapter-number">{String(chapter.number).padStart(2, "0")}</span>
            <span className="public-chapter-copy"><strong>{chapter.title}</strong><small>{chapter.summary ?? `Chapter ${chapter.number}`}</small></span>
            <span className="public-chapter-action">Read <ArrowRight size={15} /></span>
          </Link>)}
        </div>
      </section>
      <aside className="story-detail-sidebar"><section className="detail-sidebar-card"><span className="eyebrow">ABOUT THIS STORY</span><h2>At a glance</h2><dl className="story-facts">
        <div><dt>Creator</dt><dd><Feather size={14} /><Link href={`/creators/${story.author.id}`}>{story.author.displayName}</Link></dd></div>
        <div><dt>Genre</dt><dd>{genre}</dd></div><div><dt>Format</dt><dd>{format}</dd></div><div><dt>Publication</dt><dd>{story.publicationStatus === "COMPLETED" ? "Completed" : "Ongoing"}</dd></div>
      </dl></section></aside>
    </main>
  </>;
}
