"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownAZ,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Clock3,
  Compass,
  FilterX,
  Search,
  SlidersHorizontal,
  Sparkles
} from "lucide-react";
import StoryCard from "@/components/story-card";
import { allStories, genres, type Story, type StoryType } from "@/lib/demo-content";

type FormatFilter = "All formats" | StoryType;
type StatusFilter = "All status" | "Ongoing" | "Completed";
type SortOption = "title-asc" | "title-desc" | "shortest" | "longest";

const FORMAT_OPTIONS: FormatFilter[] = ["All formats", "Comic", "Novel", "Short story"];
const STATUS_OPTIONS: StatusFilter[] = ["All status", "Ongoing", "Completed"];
const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "title-asc", label: "Title: A to Z" },
  { value: "title-desc", label: "Title: Z to A" },
  { value: "shortest", label: "Shortest read" },
  { value: "longest", label: "Longest read" }
];

function sortStories(stories: Story[], sort: SortOption): Story[] {
  return [...stories].sort((first, second) => {
    if (sort === "shortest") {
      return first.minutes - second.minutes || first.title.localeCompare(second.title);
    }
    if (sort === "longest") {
      return second.minutes - first.minutes || first.title.localeCompare(second.title);
    }
    if (sort === "title-desc") return second.title.localeCompare(first.title);
    return first.title.localeCompare(second.title);
  });
}

export default function DiscoverPage() {
  const [query, setQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [format, setFormat] = useState<FormatFilter>("All formats");
  const [status, setStatus] = useState<StatusFilter>("All status");
  const [sort, setSort] = useState<SortOption>("title-asc");

  const filteredStories = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const matches = allStories.filter((story) => {
      const searchableText = [
        story.title,
        story.creator,
        story.genre,
        story.type,
        story.description
      ].join(" ").toLowerCase();

      const matchesQuery = !normalizedQuery || searchableText.includes(normalizedQuery);
      const matchesGenre = !selectedGenre || story.genre === selectedGenre;
      const matchesFormat = format === "All formats" || story.type === format;
      const matchesStatus = status === "All status" || story.status === status;

      return matchesQuery && matchesGenre && matchesFormat && matchesStatus;
    });

    return sortStories(matches, sort);
  }, [query, selectedGenre, format, status, sort]);

  const activeFilterCount = [
    selectedGenre !== null,
    format !== "All formats",
    status !== "All status"
  ].filter(Boolean).length;

  const hasActiveFilters =
    query.trim().length > 0 || activeFilterCount > 0 || sort !== "title-asc";

  function clearFilters() {
    setQuery("");
    setSelectedGenre(null);
    setFormat("All formats");
    setStatus("All status");
    setSort("title-asc");
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
            <Link className="nav-active" href="/discover">Discover</Link>
            <Link href="/#genres">Genres</Link>
            <Link href="/library">My Library</Link>
            <Link href="/#creators">Creators</Link>
          </nav>
          <div className="header-actions">
            <Link href="/library" className="profile-button" aria-label="My Library">
              <BookOpen size={17} />
            </Link>
          </div>
        </div>
      </header>

      <main className="discover-shell">
        <div className="discover-breadcrumb">
          <Link href="/"><ArrowLeft size={14} /> Home</Link>
          <span aria-hidden="true">/</span>
          <span>Discover</span>
        </div>

        <section className="discover-intro">
          <div>
            <span className="eyebrow"><Compass size={13} /> THE STORYWORLD CATALOG</span>
            <h1>Find your next <span>favourite story.</span></h1>
            <p>Explore comics, novels and short stories. Search by title, creator or genre, then narrow the collection to what you feel like reading.</p>
          </div>
          <div className="discover-intro-art" aria-hidden="true">
            <BookOpen size={42} />
            <Sparkles size={18} />
          </div>
        </section>

        <form className="discover-search" onSubmit={(event) => event.preventDefault()} role="search">
          <Search size={19} aria-hidden="true" />
          <input
            type="search"
            aria-label="Search stories, creators and genres"
            placeholder="Search stories, creators or genres..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query && (
            <button type="button" className="discover-clear-search" onClick={() => setQuery("")}>
              Clear
            </button>
          )}
        </form>

        <div className="discover-layout">
          <aside className="discover-filters" aria-label="Story filters">
            <div className="discover-filter-heading">
              <div><SlidersHorizontal size={16} /><h2>Filters</h2></div>
              {activeFilterCount > 0 && <span>{activeFilterCount} active</span>}
            </div>

            <section className="discover-filter-group">
              <h3>Format</h3>
              <div className="discover-filter-options">
                {FORMAT_OPTIONS.map((option) => (
                  <button
                    type="button"
                    key={option}
                    className={format === option ? "discover-filter-option is-active" : "discover-filter-option"}
                    onClick={() => setFormat(option)}
                    aria-pressed={format === option}
                  >
                    <span>{option}</span>
                    {format === option && <Check size={14} />}
                  </button>
                ))}
              </div>
            </section>

            <section className="discover-filter-group">
              <h3>Genre</h3>
              <div className="discover-genre-options">
                {genres.map((genre) => (
                  <button
                    type="button"
                    key={genre}
                    className={selectedGenre === genre ? "discover-genre-chip is-active" : "discover-genre-chip"}
                    onClick={() => setSelectedGenre((current) => current === genre ? null : genre)}
                    aria-pressed={selectedGenre === genre}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </section>

            <section className="discover-filter-group">
              <h3>Publication status</h3>
              <div className="discover-filter-options">
                {STATUS_OPTIONS.map((option) => (
                  <button
                    type="button"
                    key={option}
                    className={status === option ? "discover-filter-option is-active" : "discover-filter-option"}
                    onClick={() => setStatus(option)}
                    aria-pressed={status === option}
                  >
                    <span>{option === "All status" ? "Any status" : option}</span>
                    {status === option && <Check size={14} />}
                  </button>
                ))}
              </div>
            </section>

            <button type="button" className="discover-reset-button" onClick={clearFilters}>
              <FilterX size={14} /> Reset all filters
            </button>
          </aside>

          <section className="discover-results" aria-labelledby="discover-results-title">
            <div className="discover-results-heading">
              <div>
                <span className="eyebrow">BROWSE THE COLLECTION</span>
                <h2 id="discover-results-title">{selectedGenre ? selectedGenre + " stories" : "All stories"}</h2>
                <p>{filteredStories.length} {filteredStories.length === 1 ? "story" : "stories"} to explore</p>
              </div>
              <label className="discover-sort">
                <ArrowDownAZ size={15} />
                <span className="sr-only">Sort stories</span>
                <select value={sort} onChange={(event) => setSort(event.target.value as SortOption)}>
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            </div>

            {hasActiveFilters && (
              <div className="discover-active-filters" aria-live="polite">
                {query.trim() && <span>Search: “{query.trim()}”</span>}
                {selectedGenre && <span>{selectedGenre}</span>}
                {format !== "All formats" && <span>{format}</span>}
                {status !== "All status" && <span>{status}</span>}
                {sort !== "title-asc" && <span>{SORT_OPTIONS.find((option) => option.value === sort)?.label}</span>}
                <button type="button" onClick={clearFilters}>Clear all</button>
              </div>
            )}

            {filteredStories.length > 0 ? (
              <div className="story-grid discover-story-grid">
                {filteredStories.map((story) => <StoryCard key={story.id} story={story} />)}
              </div>
            ) : (
              <div className="discover-empty">
                <Search size={25} />
                <h3>No stories found</h3>
                <p>Try a different search or remove one of your filters.</p>
                <button type="button" className="button-primary" onClick={clearFilters}>
                  Clear filters <ArrowRight size={15} />
                </button>
              </div>
            )}
          </section>
        </div>
      </main>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        <Link href="/"><BookOpen size={19} /><span>Home</span></Link>
        <Link href="/discover" className="mobile-nav-active"><Compass size={19} /><span>Discover</span></Link>
        <Link href="/library"><Clock3 size={19} /><span>My Library</span></Link>
        <Link href="/#creator"><Sparkles size={19} /><span>Create</span></Link>
      </nav>
    </>
  );
}
