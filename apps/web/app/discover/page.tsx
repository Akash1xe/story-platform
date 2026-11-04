import type { Metadata } from "next";
import DiscoverPage from "@/components/discover-page";
import { listPublicStories, toCatalogStory } from "@/lib/public-stories";

export const metadata: Metadata = {
  title: "Discover Stories | StoryWorld",
  description: "Explore published comics, novels and short stories by genre, format and publication status."
};

export default async function Page() {
  const catalog = await listPublicStories({ limit: 40 });
  return <DiscoverPage stories={catalog.stories.map(toCatalogStory)} genres={catalog.genres} />;
}
