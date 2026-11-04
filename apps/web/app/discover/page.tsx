import type { Metadata } from "next";
import DiscoverPage from "@/components/discover-page";

export const metadata: Metadata = {
  title: "Discover Stories | StoryWorld",
  description: "Explore comics, novels and short stories by genre, format and publication status."
};

export default function Page() {
  return <DiscoverPage />;
}
