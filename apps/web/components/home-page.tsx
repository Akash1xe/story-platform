"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Bookmark,
  ChevronRight,
  Clock3,
  Compass,
  PenLine,
  Search,
  Sparkles,
  UserRound,
} from "lucide-react";
import StoryCard from "@/components/story-card";
import NotificationBell from "@/components/notification-bell";
import type { Story } from "@/lib/demo-content";
import { useReaderLibrary } from "@/hooks/use-reader-library";
import { fetchReaderRecommendations } from "@/lib/reader-library";

type HomePageProps = {
  stories: Story[];
  genres: string[];
  catalogUnavailable?: boolean;
};

export default function HomePage({ stories, genres, catalogUnavailable = false }: HomePageProps) {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { isReady: readerReady, isAuthenticated } = useReaderLibrary();
  const [recommendedStories, setRecommendedStories] = useState<Story[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState("");

  useEffect(() => {
    if (!readerReady) return;
    let active = true;
    if (!isAuthenticated) {
      setRecommendedStories([]);
      setRecommendationsLoading(false);
      setRecommendationsError("");
      return;
    }
    setRecommendationsLoading(true);
    setRecommendationsError("");
    fetchReaderRecommendations()
      .then((items) => {
        if (active) setRecommendedStories(items.map((item) => item.story));
      })
      .catch((error: unknown) => {
        if (active) {
          setRecommendationsError(
            error instanceof Error
              ? error.message
              : "Personalized recommendations could not be loaded.",
          );
        }
      })
      .finally(() => {
        if (active) setRecommendationsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [readerReady, isAuthenticated]);

  const featuredStory = stories[0] ?? null;
  const quickReads = useMemo(
    () => stories.filter((story) => story.type === "Short story").slice(0, 4),
    [stories],
  );
  const visibleStories = useMemo(
    () => selectedGenre
      ? stories.filter((story) => story.genre === selectedGenre)
      : stories.slice(0, 4),
    [stories, selectedGenre],
  );
  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    return stories.filter((story) =>
      [story.title, story.creator, story.genre, story.type, story.description]
        .join(" ")
        .toLowerCase()
        .includes(query),
    ).slice(0, 8);
  }, [stories, searchQuery]);
  const showSearchResults = searchQuery.trim().length > 0;
  const latestStories = stories.slice(0, 3);

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <Link href="/" className="brand" aria-label="StoryWorld home">
            <span className="brand-icon"><BookOpen size={20} /></span>
            <span>StoryWorld<span className="brand-period">.</span></span>
          </Link>
          <nav className="desktop-nav" aria-label="Main navigation">
            <Link className="nav-active" href="/">Home</Link>
            <Link href="/discover">Discover</Link>
            <Link href="#genres">Genres</Link>
            <Link href="/library">My Library</Link>
            <Link href="/following">Following</Link>
            <Link href="/creator">Creators</Link>
          </nav>
          <div className="header-actions">
            <NotificationBell />
            <label className="search-box">
              <Search size={16} aria-hidden="true" />
              <input
                aria-label="Search published stories"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search stories..."
              />
            </label>
            <Link href="/library" className="profile-button" aria-label="My Library">
              <UserRound size={18} />
            </Link>
          </div>
        </div>
      </header>

      <main id="home" className="page-shell">
        {catalogUnavailable && (
          <p className="home-catalog-message" role="status">
            The published story catalog is temporarily unavailable. Please try again shortly.
          </p>
        )}

        {showSearchResults && (
          <section className="search-results" aria-live="polite">
            <div className="section-heading">
              <div><span className="eyebrow">DISCOVERY</span><h2>Search results</h2></div>
              <button type="button" className="text-link" onClick={() => setSearchQuery("")}>Clear search</button>
            </div>
            {searchResults.length ? (
              <div className="story-grid search-grid">
                {searchResults.map((story) => <StoryCard key={story.id} story={story} />)}
              </div>
            ) : (
              <p className="empty-message">No published stories match that search. Try another title, creator or genre.</p>
            )}
          </section>
        )}

        <section
          className="hero"
          aria-labelledby="hero-title"
          style={{
            backgroundImage: featuredStory?.coverImage
              ? "linear-gradient(90deg, rgba(13,16,23,.98) 0%, rgba(13,16,23,.82) 48%, rgba(13,16,23,.2) 100%), url('" + featuredStory.coverImage + "')"
              : "radial-gradient(circle at 78% 42%, #40345e 0%, #201a30 28%, #111722 68%, #0d1017 100%)",
          }}
        >
          <div className="hero-content">
            <div className="hero-label"><Sparkles size={14} />{featuredStory ? "LATEST FROM THE STORYWORLD CATALOG" : "A HOME FOR STORIES AND STORYTELLERS"}</div>
            <h1 id="hero-title">Every world begins<br />with a <span>story.</span></h1>
            <p className="hero-description">
              {featuredStory
                ? featuredStory.description
                : "Discover comics, novels and short stories from independent creators. New publications will appear here as they are approved."}
            </p>
            {featuredStory && (
              <div className="hero-details">
                <span>NEWEST PUBLICATION</span><span className="detail-dot" />
                <span>{featuredStory.genre} · {featuredStory.type}</span>
              </div>
            )}
            <div className="hero-actions">
              {featuredStory ? (
                <Link className="button-primary" href={`/stories/${featuredStory.id}`}>Read the latest story <ArrowRight size={16} /></Link>
              ) : (
                <Link className="button-primary" href="/discover">Explore stories <ArrowRight size={16} /></Link>
              )}
              <Link className="button-secondary" href="/creator">Become a creator</Link>
            </div>
          </div>
          <div className="hero-side-note"><span className="hero-side-line" />STORIES WORTH GETTING LOST IN</div>
        </section>

        <section className="section quick-section" id="discover">
          <div className="section-heading">
            <div><span className="eyebrow">SHORT FORM STORIES</span><h2>Quick reads</h2><p>Standalone stories for a short break or a change of pace.</p></div>
            <span className="section-icon"><Clock3 size={21} /></span>
          </div>
          {quickReads.length ? (
            <div className="quick-story-list">
              {quickReads.map((story) => (
                <Link className="quick-story" href={`/stories/${story.id}`} key={story.id}>
                  <div className="quick-art" style={{ backgroundImage: "url('" + story.coverImage + "')" }} role="img" aria-label={`Cover artwork for ${story.title}`} />
                  <div className="quick-copy"><strong>{story.title}</strong><span>{story.genre} · {story.creator}</span></div>
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              ))}
            </div>
          ) : (
            <p className="empty-message">Published short stories will appear here.</p>
          )}
        </section>

        {readerReady && isAuthenticated && (
          <section className="section recommendations-section" aria-labelledby="recommendations-title">
            <div className="section-heading">
              <div>
                <span className="eyebrow">BASED ON YOUR READING</span>
                <h2 id="recommendations-title">Picked for you</h2>
                <p>Stories selected from the genres you save, read and rate.</p>
              </div>
              <span className="section-icon"><Sparkles size={21} /></span>
            </div>
            {recommendationsLoading ? (
              <p className="empty-message" role="status">Finding stories you might enjoy…</p>
            ) : recommendationsError ? (
              <p className="empty-message" role="status">{recommendationsError}</p>
            ) : recommendedStories.length ? (
              <div className="story-grid">
                {recommendedStories.map((story) => (
                  <StoryCard key={story.id} story={story} />
                ))}
              </div>
            ) : (
              <p className="empty-message">You’re all caught up. New stories will appear here as the catalog grows.</p>
            )}
          </section>
        )}

        <section className="section" id="collection">
          <div className="section-heading">
            <div>
              <span className="eyebrow">A WORLD OF STORIES</span>
              <h2>{selectedGenre ? selectedGenre + " stories" : "Explore the collection"}</h2>
              <p>Published comics, novels and short stories from the StoryWorld community.</p>
            </div>
            {selectedGenre ? (
              <button type="button" className="text-link" onClick={() => setSelectedGenre(null)}>Clear filter</button>
            ) : <span className="section-icon"><BookOpen size={21} /></span>}
          </div>
          {visibleStories.length ? (
            <div className="story-grid">{visibleStories.map((story) => <StoryCard key={story.id} story={story} />)}</div>
          ) : (
            <p className="empty-message">{stories.length ? "No published stories in this genre yet." : "Approved creator publications will appear here."}</p>
          )}
          {stories.length > 4 && <div className="home-view-all"><Link href="/discover" className="text-link">Browse all stories <ArrowRight size={15} /></Link></div>}
        </section>

        <section className="section genre-section" id="genres">
          <div className="section-heading">
            <div><span className="eyebrow">FIND YOUR KIND OF STORY</span><h2>Explore by genre</h2><p>Choose a genre to filter the published collection.</p></div>
            <Compass size={23} className="muted-icon" />
          </div>
          {genres.length ? (
            <div className="genre-grid">
              {genres.map((genre, index) => (
                <button
                  type="button"
                  className={"genre-card genre-" + (index % 5) + (selectedGenre === genre ? " genre-selected" : "")}
                  key={genre}
                  onClick={() => {
                    setSelectedGenre((current) => current === genre ? null : genre);
                    document.getElementById("collection")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  aria-pressed={selectedGenre === genre}
                >
                  <span>{genre}</span><ArrowRight size={16} />
                </button>
              ))}
            </div>
          ) : <p className="empty-message">Genres will appear once stories are published.</p>}
        </section>

        <section className="section updates-section">
          <div className="section-heading">
            <div><span className="eyebrow">FRESH FROM CREATORS</span><h2>Recently published</h2><p>The latest stories approved and published on StoryWorld.</p></div>
            <span className="section-icon"><Clock3 size={21} /></span>
          </div>
          {latestStories.length ? (
            <div className="update-list">
              {latestStories.map((story) => (
                <article className="update-item" key={story.id}>
                  <div className="update-cover" style={{ backgroundImage: "url('" + story.coverImage + "')" }} role="img" aria-label={`Cover artwork for ${story.title}`} />
                  <div className="update-copy">
                    <span>{story.type} · {story.genre}</span>
                    <h3><Link href={`/stories/${story.id}`}>{story.title}</Link></h3>
                    <p>Created by {story.creator}</p>
                    <small>{story.status}</small>
                  </div>
                  <Link className="round-arrow" href={`/stories/${story.id}`} aria-label={`View ${story.title}`}><ArrowRight size={17} /></Link>
                </article>
              ))}
            </div>
          ) : <p className="empty-message">New creator publications will appear here.</p>}
        </section>

        <section className="creator-banner" id="creator">
          <div className="creator-banner-icon"><PenLine size={24} /></div>
          <div className="creator-banner-copy" id="creators">
            <span className="eyebrow">FOR THE STORYTELLERS</span><h2>Have a story to tell?</h2>
            <p>Share your imagination, publish your work and find readers who will love your stories.</p>
          </div>
          <Link className="button-primary" href="/creator">Open Creator Studio <ArrowRight size={16} /></Link>
        </section>

        <footer className="site-footer" id="profile">
          <Link href="/" className="brand"><span className="brand-icon"><BookOpen size={19} /></span><span>StoryWorld<span className="brand-period">.</span></span></Link>
          <p>Read something extraordinary. Create something unforgettable.</p>
          <div className="footer-links"><Link href="#home">About</Link><Link href="#home">Community guidelines</Link><Link href="#home">Privacy</Link><Link href="#home">Terms</Link></div>
          <small>© 2026 StoryWorld · A home for independent stories</small>
        </footer>
      </main>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        <Link href="#home" className="mobile-nav-active"><BookOpen size={19} /><span>Home</span></Link>
        <Link href="/discover"><Compass size={19} /><span>Discover</span></Link>
        <Link href="/library"><Bookmark size={19} /><span>My Library</span></Link>
        <Link href="/creator"><UserRound size={19} /><span>Creator</span></Link>
      </nav>
    </>
  );
}
