"use client";

import { useEffect, useRef, useState } from "react";
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
  LoaderCircle,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import StoryCard from "@/components/story-card";
import NotificationBell from "@/components/notification-bell";
import type { Story } from "@/lib/demo-content";
import {
  fetchPublicStoryCatalog,
  toCatalogStory,
  type CatalogFilters,
} from "@/lib/public-stories";

const PAGE_SIZE = 24;

type FormatValue = "" | "COMIC" | "NOVEL" | "SHORT_STORY";
type StatusValue = "" | "ONGOING" | "COMPLETED";
type SortValue = "newest" | "oldest" | "title";

const FORMAT_OPTIONS: Array<{ value: FormatValue; label: string }> = [
  { value: "", label: "All formats" },
  { value: "COMIC", label: "Comic" },
  { value: "NOVEL", label: "Novel" },
  { value: "SHORT_STORY", label: "Short story" },
];

const STATUS_OPTIONS: Array<{ value: StatusValue; label: string }> = [
  { value: "", label: "Any status" },
  { value: "ONGOING", label: "Ongoing" },
  { value: "COMPLETED", label: "Completed" },
];

const SORT_OPTIONS: Array<{ value: SortValue; label: string }> = [
  { value: "newest", label: "Recently published" },
  { value: "oldest", label: "Oldest first" },
  { value: "title", label: "Title: A to Z" },
];

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type DiscoverPageProps = {
  stories: Story[];
  genres: string[];
  pagination: Pagination;
  filters: CatalogFilters;
  initialError?: string;
};

function updateAddress(filters: CatalogFilters) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.genre) params.set("genre", filters.genre);
  if (filters.format) params.set("format", filters.format);
  if (filters.status) params.set("status", filters.status);
  if (filters.sort && filters.sort !== "newest") params.set("sort", filters.sort);
  if (filters.page && filters.page > 1) params.set("page", String(filters.page));

  const query = params.toString();
  window.history.replaceState(null, "", "/discover" + (query ? "?" + query : ""));
}

export default function DiscoverPage({
  stories: initialStories,
  genres: initialGenres,
  pagination: initialPagination,
  filters: initialFilters,
  initialError,
}: DiscoverPageProps) {
  const [stories, setStories] = useState(initialStories);
  const [genres, setGenres] = useState(initialGenres);
  const [pagination, setPagination] = useState(initialPagination);
  const [query, setQuery] = useState(initialFilters.q ?? "");
  const [selectedGenre, setSelectedGenre] = useState(initialFilters.genre ?? "");
  const [format, setFormat] = useState<FormatValue>(initialFilters.format ?? "");
  const [status, setStatus] = useState<StatusValue>(initialFilters.status ?? "");
  const [sort, setSort] = useState<SortValue>(initialFilters.sort ?? "newest");
  const [page, setPage] = useState(initialFilters.page ?? 1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(initialError ?? "");
  const [retryKey, setRetryKey] = useState(0);
  const hasSkippedInitialRequest = useRef(false);

  useEffect(() => {
    if (!hasSkippedInitialRequest.current) {
      hasSkippedInitialRequest.current = true;
      return;
    }

    const controller = new AbortController();
    const delay = window.setTimeout(async () => {
      const filters: CatalogFilters = {
        q: query.trim() || undefined,
        genre: selectedGenre || undefined,
        format: format || undefined,
        status: status || undefined,
        sort,
        page,
        limit: PAGE_SIZE,
      };

      updateAddress(filters);
      setIsLoading(true);
      setError("");

      try {
        const catalog = await fetchPublicStoryCatalog(filters, controller.signal);
        if (controller.signal.aborted) return;
        setStories(catalog.stories.map(toCatalogStory));
        setGenres(catalog.genres);
        setPagination(catalog.pagination);
      } catch (cause) {
        if (controller.signal.aborted) return;
        setError(
          cause instanceof Error
            ? cause.message
            : "The story catalog could not be refreshed. Please try again.",
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, query.trim() ? 300 : 0);

    return () => {
      window.clearTimeout(delay);
      controller.abort();
    };
  }, [query, selectedGenre, format, status, sort, page, retryKey]);

  const activeFilterCount = [
    query.trim().length > 0,
    selectedGenre.length > 0,
    format.length > 0,
    status.length > 0,
  ].filter(Boolean).length;
  const hasActiveFilters = activeFilterCount > 0 || sort !== "newest";

  function clearFilters() {
    setQuery("");
    setSelectedGenre("");
    setFormat("");
    setStatus("");
    setSort("newest");
    setPage(1);
  }

  function retryRequest() {
    setRetryKey((current) => current + 1);
  }

  const heading = selectedGenre
    ? selectedGenre + " stories"
    : query.trim()
      ? "Search results"
      : "All stories";

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
            <Link href="/following">Following</Link>
            <Link href="/creator">Creators</Link>
          </nav>
          <div className="header-actions">
            <NotificationBell />
            <Link href="/library" className="profile-button" aria-label="My Library">
              <BookOpen size={17} />
            </Link>
          </div>
        </div>
      </header>

      <main className="discover-shell">
        <div className="discover-breadcrumb">
          <Link href="/"><ArrowLeft size={14} /> Home</Link>
          <span>/</span>
          <span>Discover</span>
        </div>

        <section className="discover-intro">
          <div>
            <span className="eyebrow"><Compass size={13} /> THE STORYWORLD CATALOG</span>
            <h1>Find your next <span>favourite story.</span></h1>
            <p>
              Explore published comics, novels and short stories. Search by title,
              creator or genre, then narrow the collection to what you feel like reading.
            </p>
          </div>
          <div className="discover-intro-art" aria-hidden="true">
            <BookOpen size={42} />
            <Sparkles size={18} />
          </div>
        </section>

        <form
          className="discover-search"
          role="search"
          onSubmit={(event) => event.preventDefault()}
        >
          <Search size={19} aria-hidden="true" />
          <input
            type="search"
            aria-label="Search stories, creators and genres"
            placeholder="Search stories, creators or genres..."
            maxLength={120}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
          />
          {query && (
            <button
              type="button"
              className="discover-clear-search"
              onClick={() => {
                setQuery("");
                setPage(1);
              }}
            >
              Clear
            </button>
          )}
        </form>

        <div className="discover-layout">
          <aside className="discover-filters" aria-label="Story filters">
            <div className="discover-filter-heading">
              <div><SlidersHorizontal size={16} /><h2>Filters</h2></div>
              {activeFilterCount > 0 && (
                <span>{activeFilterCount} active</span>
              )}
            </div>

            <section className="discover-filter-group">
              <h3>Format</h3>
              <div className="discover-filter-options">
                {FORMAT_OPTIONS.map((option) => (
                  <button
                    type="button"
                    key={option.value || "all-formats"}
                    className={format === option.value ? "discover-filter-option is-active" : "discover-filter-option"}
                    onClick={() => {
                      setFormat(option.value);
                      setPage(1);
                    }}
                    aria-pressed={format === option.value}
                  >
                    <span>{option.label}</span>
                    {format === option.value && <Check size={14} />}
                  </button>
                ))}
              </div>
            </section>

            <section className="discover-filter-group">
              <h3>Genre</h3>
              {genres.length ? (
                <div className="discover-genre-options">
                  {genres.map((genre) => (
                    <button
                      type="button"
                      key={genre}
                      className={selectedGenre === genre ? "discover-genre-chip is-active" : "discover-genre-chip"}
                      onClick={() => {
                        setSelectedGenre((current) => current === genre ? "" : genre);
                        setPage(1);
                      }}
                      aria-pressed={selectedGenre === genre}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="discover-filter-hint">Genres will appear as stories are published.</p>
              )}
            </section>

            <section className="discover-filter-group">
              <h3>Publication status</h3>
              <div className="discover-filter-options">
                {STATUS_OPTIONS.map((option) => (
                  <button
                    type="button"
                    key={option.value || "all-status"}
                    className={status === option.value ? "discover-filter-option is-active" : "discover-filter-option"}
                    onClick={() => {
                      setStatus(option.value);
                      setPage(1);
                    }}
                    aria-pressed={status === option.value}
                  >
                    <span>{option.label}</span>
                    {status === option.value && <Check size={14} />}
                  </button>
                ))}
              </div>
            </section>

            <button type="button" className="discover-reset-button" onClick={clearFilters}>
              <FilterX size={14} /> Reset all filters
            </button>
          </aside>

          <section
            className="discover-results"
            aria-labelledby="discover-results-title"
            aria-busy={isLoading}
          >
            <div className="discover-results-heading">
              <div>
                <span className="eyebrow">BROWSE THE COLLECTION</span>
                <h2 id="discover-results-title">{heading}</h2>
                <p>
                  {pagination.total.toLocaleString()} published{" "}
                  {pagination.total === 1 ? "story" : "stories"}
                </p>
              </div>
              <label className="discover-sort">
                <ArrowDownAZ size={15} />
                <span className="sr-only">Sort stories</span>
                <select
                  value={sort}
                  onChange={(event) => {
                    setSort(event.target.value as SortValue);
                    setPage(1);
                  }}
                >
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
                {format && <span>{FORMAT_OPTIONS.find((item) => item.value === format)?.label}</span>}
                {status && <span>{STATUS_OPTIONS.find((item) => item.value === status)?.label}</span>}
                {sort !== "newest" && <span>{SORT_OPTIONS.find((item) => item.value === sort)?.label}</span>}
                <button type="button" onClick={clearFilters}>Clear all</button>
              </div>
            )}

            {isLoading && (
              <div className="discover-loading" role="status">
                <LoaderCircle size={15} className="discover-spinner" />
                Updating the collection…
              </div>
            )}

            {error && stories.length > 0 && (
              <div className="discover-request-error" role="alert">
                <span>{error} Your previous results are still shown.</span>
                <button type="button" onClick={retryRequest}><RefreshCw size={13} /> Retry</button>
              </div>
            )}

            {error && stories.length === 0 ? (
              <div className="discover-empty discover-error-state" role="alert">
                <RefreshCw size={24} />
                <h3>We couldn’t load the collection</h3>
                <p>{error}</p>
                <button type="button" className="button-primary" onClick={retryRequest}>
                  Try again <ArrowRight size={15} />
                </button>
              </div>
            ) : isLoading && stories.length === 0 ? (
              <div className="discover-loading-panel" role="status">
                <LoaderCircle size={22} className="discover-spinner" />
                <strong>Finding stories</strong>
                <span>Searching the StoryWorld catalog…</span>
              </div>
            ) : stories.length > 0 ? (
              <>
                <div className="discover-result-summary">
                  Showing {(pagination.page - 1) * pagination.limit + 1}–
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                  {pagination.total.toLocaleString()} stories
                </div>
                <div className="story-grid discover-story-grid">
                  {stories.map((story) => <StoryCard key={story.id} story={story} />)}
                </div>

                {pagination.totalPages > 1 && (
                  <nav className="discover-pagination" aria-label="Story result pages">
                    <button
                      type="button"
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                      disabled={isLoading || page <= 1}
                    >
                      <ArrowLeft size={14} /> Previous
                    </button>
                    <span>Page <strong>{pagination.page}</strong> of {pagination.totalPages}</span>
                    <button
                      type="button"
                      onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
                      disabled={isLoading || page >= pagination.totalPages}
                    >
                      Next <ArrowRight size={14} />
                    </button>
                  </nav>
                )}
              </>
            ) : (
              <div className="discover-empty">
                <Search size={25} />
                <h3>No published stories found</h3>
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
