import type { Metadata } from "next";
import LibraryPage from "@/components/library-page";

export const metadata: Metadata = {
  title: "My Library | StoryWorld",
  description: "Your saved stories and reading progress on StoryWorld."
};

export default function Page() {
  return <LibraryPage />;
}
