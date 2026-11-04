"use client";

import { useMemo, useState } from "react";
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
  UserRound
} from "lucide-react";
import StoryCard from "@/components/story-card";
import {
  demoStories,
  featuredStory,
  genres
} from "@/lib/demo-content";

type DurationFilter = 3 | 5 | 10 | null;

export default function HomePage() {
  const [selectedDuration, setSelectedDuration] =
    useState<DurationFilter>(null);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const quickReads = useMemo(
    () => demoStories.filter((story) => story.type === "Short story"),
    []
  );

  const filteredQuickReads = useMemo(() => {
    if (selectedDuration === null) return quickReads;
    if (selectedDuration === 3) {
      return quickReads.filter((story) => story.minutes <= 3);
    }
    if (selectedDuration === 5) {
      return quickReads.filter(
        (story) => story.minutes > 3 && story.minutes <= 5
      );
    }
    return quickReads.filter((story) => story.minutes >= 10);
  }, [quickReads, selectedDuration]);

  const visibleStories = useMemo(() => {
    if (!selectedGenre) return demoStories.slice(0, 4);
    return demoStories.filter((story) => story.genre === selectedGenre);
  }, [selectedGenre]);

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    return [featuredStory, ...demoStories]
      .filter((story) =>
        [
          story.title,
          story.creator,
          story.genre,
          story.type,
          story.description
        ]
          .join(" ")
          .toLowerCase()
          .includes(query)
      )
      .slice(0, 8);
  }, [searchQuery]);

  const showSearchResults = searchQuery.trim().length > 0;

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <a href="#home" className="brand" aria-label="StoryWorld home">
            <span className="brand-icon">
              <BookOpen size={20} />
            </span>
            <span>
              StoryWorld<span className="brand-period">.</span>
            </span>
          </a>

          <nav className="desktop-nav" aria-label="Main navigation">
            <a className="nav-active" href="#home">Home</a>
            <a href="#discover">Discover</a>
            <a href="#genres">Genres</a>
            <a href="#creators">Creators</a>
          </nav>

          <div className="header-actions">
            <label className="search-box">
              <Search size={16} aria-hidden="true" />
              <input
                aria-label="Search sample stories"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search stories..."
              />
            </label>
            <a href="#creator" className="creator-button">
              <PenLine size={14} />
              Start creating
            </a>
            <a
              href="#profile"
              className="profile-button"
              aria-label="Profile preview"
            >
              <UserRound size={18} />
            </a>
          </div>
        </div>
      </header>

      <main id="home" className="page-shell">
        <div className="demo-notice">
          <Sparkles size={13} />
          DESIGN PREVIEW — sample titles, creators and artwork
        </div>

        {showSearchResults && (
          <section className="search-results" aria-live="polite">
            <div className="section-heading">
              <div>
                <span className="eyebrow">DISCOVERY</span>
                <h2>Search results</h2>
              </div>
              <button
                type="button"
                className="text-link"
                onClick={() => setSearchQuery("")}
              >
                Clear search
              </button>
            </div>

            {searchResults.length > 0 ? (
              <div className="story-grid search-grid">
                {searchResults.map((story) => (
                  <StoryCard key={story.id} story={story} />
                ))}
              </div>
            ) : (
              <p className="empty-message">
                No sample stories found. Try another title, creator or genre.
              </p>
            )}
          </section>
        )}

        <section
          className="hero"
          aria-labelledby="hero-title"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgba(13,16,23,.98) 0%, rgba(13,16,23,.82) 48%, rgba(13,16,23,.2) 100%), url('" +
              featuredStory.coverImage +
              "')"
          }}
        >
          <div className="hero-content">
            <div className="hero-label">
              <Sparkles size={14} />
              YOUR NEXT FAVOURITE STORY STARTS HERE
            </div>

            <h1 id="hero-title">
              Every world begins
              <br />
              with a <span>story.</span>
            </h1>

            <p className="hero-description">
              Discover extraordinary comics, captivating novels and
              unforgettable short stories from creators around the world.
            </p>

            <div className="hero-details">
              <span>FEATURED PREVIEW</span>
              <span className="detail-dot" />
              <span>{featuredStory.genre} · {featuredStory.type}</span>
            </div>

            <div className="hero-actions">
              <a className="button-primary" href="#collection">
                Explore stories <ArrowRight size={16} />
              </a>
              <a className="button-secondary" href="#creator">
                Become a creator
              </a>
            </div>
          </div>

          <div className="hero-side-note">
            <span className="hero-side-line" />
            STORIES WORTH GETTING LOST IN
          </div>
        </section>

        <section className="section quick-section" id="discover">
          <div className="section-heading">
            <div>
              <span className="eyebrow">MADE FOR YOUR MOMENT</span>
              <h2>How much time do you have?</h2>
              <p>Find something interesting, whatever your day looks like.</p>
            </div>
            <span className="section-icon">
              <Clock3 size={21} />
            </span>
          </div>

          <div className="time-options">
            {[
              { value: 3 as const, label: "Up to 3 minutes", sub: "A quick escape" },
              { value: 5 as const, label: "Up to 5 minutes", sub: "A little adventure" },
              { value: 10 as const, label: "10+ minutes", sub: "Get immersed" }
            ].map((item) => (
              <button
                type="button"
                key={item.value}
                className={
                  "time-option" +
                  (selectedDuration === item.value ? " time-selected" : "")
                }
                onClick={() =>
                  setSelectedDuration((current) =>
                    current === item.value ? null : item.value
                  )
                }
                aria-pressed={selectedDuration === item.value}
              >
                <span className="time-number">
                  {item.value === 10 ? "10+" : item.value}
                </span>
                <span className="time-copy">
                  <strong>{item.label}</strong>
                  <small>{item.sub}</small>
                </span>
                <ChevronRight size={18} className="time-arrow" />
              </button>
            ))}
          </div>

          <div className="quick-results">
            <div className="mini-heading">
              <span>
                {selectedDuration === null
                  ? "A few stories to get you started"
                  : selectedDuration === 10
                    ? "Stories that take 10 minutes or more"
                    : "Stories up to " + selectedDuration + " minutes"}
              </span>
              {selectedDuration !== null && (
                <button
                  type="button"
                  onClick={() => setSelectedDuration(null)}
                >
                  Show all
                </button>
              )}
            </div>

            <div className="quick-story-list">
              {filteredQuickReads.map((story) => (
                <div className="quick-story" key={story.id}>
                  <div
                    className="quick-art"
                    style={{ backgroundImage: "url('" + story.coverImage + "')" }}
                    role="img"
                    aria-label={"Sample artwork for " + story.title}
                  />
                  <div className="quick-copy">
                    <strong>{story.title}</strong>
                    <span>{story.genre} · {story.minutes} min</span>
                  </div>
                  <ArrowRight size={16} aria-hidden="true" />
                </div>
              ))}
              {filteredQuickReads.length === 0 && (
                <p className="empty-message">
                  No sample stories match this reading time yet.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="section" id="collection">
          <div className="section-heading">
            <div>
              <span className="eyebrow">A WORLD OF STORIES</span>
              <h2>
                {selectedGenre
                  ? selectedGenre + " stories"
                  : "Explore the collection"}
              </h2>
              <p>
                Illustrative sample publications across different formats.
              </p>
            </div>
            {selectedGenre ? (
              <button
                type="button"
                className="text-link"
                onClick={() => setSelectedGenre(null)}
              >
                Clear filter
              </button>
            ) : (
              <span className="section-icon">
                <BookOpen size={21} />
              </span>
            )}
          </div>

          {visibleStories.length > 0 ? (
            <div className="story-grid">
              {visibleStories.map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
          ) : (
            <p className="empty-message">
              No sample publications in this genre yet.
            </p>
          )}
        </section>

        <section className="section genre-section" id="genres">
          <div className="section-heading">
            <div>
              <span className="eyebrow">FIND YOUR KIND OF STORY</span>
              <h2>Explore by genre</h2>
              <p>Choose a genre to filter the sample collection.</p>
            </div>
            <Compass size={23} className="muted-icon" />
          </div>

          <div className="genre-grid">
            {genres.map((genre, index) => (
              <button
                type="button"
                className={
                  "genre-card genre-" +
                  (index % 5) +
                  (selectedGenre === genre ? " genre-selected" : "")
                }
                key={genre}
                onClick={() =>
                  setSelectedGenre((current) =>
                    current === genre ? null : genre
                  )
                }
                aria-pressed={selectedGenre === genre}
              >
                <span>{genre}</span>
                <ArrowRight size={16} />
              </button>
            ))}
          </div>
        </section>

        <section className="section updates-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">COMMUNITY PREVIEW</span>
              <h2>Recently updated</h2>
              <p>Example layouts for new chapters and episodes.</p>
            </div>
            <span className="section-icon">
              <Clock3 size={21} />
            </span>
          </div>

          <div className="update-list">
            {demoStories.slice(0, 3).map((story) => (
              <article className="update-item" key={story.id}>
                <div
                  className="update-cover"
                  style={{ backgroundImage: "url('" + story.coverImage + "')" }}
                  role="img"
                  aria-label={"Sample artwork for " + story.title}
                />
                <div className="update-copy">
                  <span>{story.type} · {story.genre}</span>
                  <h3>{story.title}</h3>
                  <p>Created by {story.creator}</p>
                  <small>Example update layout · Sample content</small>
                </div>
                <span className="round-arrow" aria-hidden="true">
                  <ArrowRight size={17} />
                </span>
              </article>
            ))}
          </div>
        </section>

        <section className="creator-banner" id="creator">
          <div className="creator-banner-icon">
            <PenLine size={24} />
          </div>
          <div className="creator-banner-copy" id="creators">
            <span className="eyebrow">FOR THE STORYTELLERS</span>
            <h2>Have a story to tell?</h2>
            <p>
              Share your imagination, publish your work and find readers
              who will love your stories.
            </p>
          </div>
          <a className="button-primary" href="#home">
            Creator Studio preview <ArrowRight size={16} />
          </a>
        </section>

        <footer className="site-footer" id="profile">
          <a href="#home" className="brand">
            <span className="brand-icon">
              <BookOpen size={19} />
            </span>
            <span>
              StoryWorld<span className="brand-period">.</span>
            </span>
          </a>
          <p>Read something extraordinary. Create something unforgettable.</p>
          <div className="footer-links">
            <a href="#home">About</a>
            <a href="#home">Community guidelines</a>
            <a href="#home">Privacy</a>
            <a href="#home">Terms</a>
          </div>
          <small>© 2026 StoryWorld · Temporary project identity</small>
        </footer>
      </main>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        <a href="#home" className="mobile-nav-active">
          <BookOpen size={19} />
          <span>Home</span>
        </a>
        <a href="#discover">
          <Compass size={19} />
          <span>Discover</span>
        </a>
        <a href="#collection">
          <Bookmark size={19} />
          <span>Stories</span>
        </a>
        <a href="#creator">
          <UserRound size={19} />
          <span>Creator</span>
        </a>
      </nav>
    </>
  );
}
