import HomePage from "@/components/home-page";
import { listPublicStories, toCatalogStory } from "@/lib/public-stories";

export default async function Page() {
  try {
    const catalog = await listPublicStories({ limit: 40, sort: "newest" });
    return <HomePage stories={catalog.stories.map(toCatalogStory)} genres={catalog.genres} />;
  } catch {
    return <HomePage stories={[]} genres={[]} catalogUnavailable />;
  }
}
