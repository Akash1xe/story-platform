import type { Metadata } from "next";
import { CreatorEditor } from "@/components/creator-workspace";

export const metadata: Metadata = { title: "Create a Story | StoryWorld" };

export default function Page() {
  return <CreatorEditor />;
}
