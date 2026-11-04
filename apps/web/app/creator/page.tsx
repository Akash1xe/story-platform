import type { Metadata } from "next";
import { CreatorStudio } from "@/components/creator-workspace";

export const metadata: Metadata = {
  title: "Creator Studio | StoryWorld",
  description: "Create comics, novels and short stories on StoryWorld."
};

export default function Page() {
  return <CreatorStudio />;
}
