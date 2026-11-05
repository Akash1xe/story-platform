import type { Metadata } from "next";
import DiscoverPage from "@/components/discover-page";
import {
  listPublicStories,
  toCatalogStory,
  type CatalogFilters,
} from "@/lib/public-stories";

export const metadata: Metadata = {
  title: "Discover Stories | StoryWorld",
  description:
    "Explore published comics, novels and short stories by genre, format and publication status.",
};

const PAGE_SIZE = 24;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function positivePage(value: string) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? Math.min(parsed, 100_000) : 1;
}

export default async function Page({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const formatValue = firstValue(params.format);
  const statusValue = firstValue(params.status);
  const sortValue = firstValue(params.sort);
  const filters: CatalogFilters = {
    q: firstValue(params.q).trim().slice(0, 120) || undefined,
    genre: firstValue(params.genre).trim().slice(0, 50) || undefined,
    format:
      formatValue === "COMIC" || formatValue === "NOVEL" || formatValue === "SHORT_STORY"
        ? formatValue
        : undefined,
    status:
      statusValue === "ONGOING" || statusValue === "COMPLETED"
        ? statusValue
        : undefined,
    sort:
      sortValue === "oldest" || sortValue === "title"
        ? sortValue
        : "newest",
    page: positivePage(firstValue(params.page)),
    limit: PAGE_SIZE,
  };

  try {
    const catalog = await listPublicStories(filters);
    return (
      <DiscoverPage
        stories={catalog.stories.map(toCatalogStory)}
        genres={catalog.genres}
        pagination={catalog.pagination}
        filters={filters}
      />
    );
  } catch {
    return (
      <DiscoverPage
        stories={[]}
        genres={[]}
        pagination={{ page: filters.page ?? 1, limit: PAGE_SIZE, total: 0, totalPages: 0 }}
        filters={filters}
        initialError="The story catalog could not be reached. Please try again."
      />
    );
  }
}
