import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Feather,
  Layers3,
  Sparkles
} from "lucide-react";
import { notFound } from "next/navigation";
import { allStories, getStoryBySlug } from "@/lib/demo-content";

type StoryPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return allStories.map((story) => ({ slug: story.id }));
}

export async function generateMetadata({
  params
}: StoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const story = getStoryBySlug(slug);

  if (!story) {
    return { title: "Story not found | StoryWorld" };
  }

  return {
    title: `${story.title} | StoryWorld`,
    description: story.description,
    openGraph: {
      title: story.title,
      description: story.description,
      images: [story.coverImage]
    }
  };
}

export default async function StoryDetailsPage({ params }: StoryPageProps) {
  const { slug } = await params;
  const story = getStoryBySlug(slug);

  if (!story) {
    notFound();
  }

  return (
    <>
      <header className="site-header">
        <div className="header-inner detail-header-inner">
          <Link href="/" className="brand" aria-label="StoryWorld home">
            <span className="brand-icon">
              <BookOpen size={20} />
            </span>
            <span>
              StoryWorld<span className="brand-period">.</span>
            </span>
          </Link>
          <Link href="/#collection" className="detail-back-link">
            <ArrowLeft size={15} aria-hidden="true" />
            Back to stories
          </Link>
        </div>
      </header>

      <main className="story-detail-shell">
        <nav className="detail-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href="/#collection">Discover</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{story.title}</span>
        </nav>

        <section className="story-detail-hero" aria-labelledby="story-title">
          <div
            className="story-detail-cover"
            style={{ backgroundImage: `url("${story.coverImage}")` }}
            role="img"
            aria-label={`Sample cover artwork for ${story.title}`}
          >
            <span className="detail-preview-stamp">SAMPLE STORY</span>
          </div>

          <div className="story-detail-copy">
            <div className="detail-eyebrow">
              <Sparkles size={13} aria-hidden="true" />
              STORY PREVIEW
            </div>
            <div className="detail-type-line">
              {story.type} <span aria-hidden="true">·</span> {story.genre}
            </div>
            <h1 id="story-title">{story.title}</h1>
            <p className="detail-byline">
              Created by <span>{story.creator}</span>
            </p>
            <p className="detail-description">{story.description}</p>

            <div className="detail-tag-list" aria-label="Story details">
              <span><Layers3 size={13} /> {story.type}</span>
              <span><Clock3 size={13} /> {story.minutes} min read</span>
              <span>
                <CheckCircle2 size={13} />
                {story.status}
              </span>
            </div>

            <div className="detail-actions">
              <Link className="button-primary" href="#reading-preview">
                Read preview <ArrowRight size={16} />
              </Link>
              <Link className="button-secondary" href="/#collection">
                Explore more stories
              </Link>
            </div>
          </div>
        </section>

        <div className="story-detail-grid">
          <section className="reading-preview-section" id="reading-preview">
            <div className="detail-section-heading">
              <div>
                <span className="eyebrow">FIRST LOOK</span>
                <h2>{story.previewTitle}</h2>
                <p>A short excerpt from this sample publication.</p>
              </div>
              <span className="preview-reading-time">
                <Clock3 size={14} /> {story.minutes} min
              </span>
            </div>

            <article className="reading-excerpt">
              <div className="excerpt-kicker">
                <BookOpen size={14} aria-hidden="true" />
                PREVIEW · CHAPTER ONE
              </div>
              {story.previewParagraphs.map((paragraph, index) => (
                <p className={index === 0 ? "excerpt-opening" : ""} key={paragraph}>
                  {paragraph}
                </p>
              ))}
              <div className="excerpt-end">
                <span />
                END OF SAMPLE PREVIEW
                <span />
              </div>
            </article>

            <p className="preview-disclaimer">
              This page uses original sample text and illustrative artwork for the product
              preview. It is not a published creator submission.
            </p>
          </section>

          <aside className="story-detail-sidebar">
            <section className="detail-sidebar-card">
              <span className="eyebrow">ABOUT THIS STORY</span>
              <h2>At a glance</h2>
              <dl className="story-facts">
                <div>
                  <dt>Creator</dt>
                  <dd><Feather size={14} /> {story.creator}</dd>
                </div>
                <div>
                  <dt>Genre</dt>
                  <dd>{story.genre}</dd>
                </div>
                <div>
                  <dt>Format</dt>
                  <dd>{story.type}</dd>
                </div>
                <div>
                  <dt>Publication</dt>
                  <dd>{story.status}</dd>
                </div>
              </dl>
            </section>

            <section className="detail-sidebar-note">
              <Sparkles size={17} aria-hidden="true" />
              <h3>Discover independent stories</h3>
              <p>
                StoryWorld is being built for comics, novels and short stories from
                creators around the world.
              </p>
              <Link href="/#collection">
                Browse the collection <ArrowRight size={14} />
              </Link>
            </section>
          </aside>
        </div>

        <footer className="detail-footer">
          <Link href="/" className="brand">
            <span className="brand-icon"><BookOpen size={17} /></span>
            <span>StoryWorld<span className="brand-period">.</span></span>
          </Link>
          <span>Design preview · Sample publication</span>
        </footer>
      </main>
    </>
  );
}
