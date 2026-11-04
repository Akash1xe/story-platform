import type { Metadata } from "next";
import { CreatorEditor } from "@/components/creator-workspace";

export const metadata: Metadata = { title: "Edit Story | StoryWorld" };

type PageProps = { params: Promise<{ storyId: string }> };

export default async function Page({ params }: PageProps) {
  const { storyId } = await params;
  return <CreatorEditor storyId={storyId} />;
}
