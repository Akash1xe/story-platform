import type { Metadata } from "next";
import { CreatorEditor } from "@/components/creator-workspace";
import { requireUserRole } from "@/lib/server-auth";

export const metadata: Metadata = { title: "Edit Story | StoryWorld" };

type PageProps = { params: Promise<{ storyId: string }> };

export default async function Page({ params }: PageProps) {
  const { storyId } = await params;
  await requireUserRole(["CREATOR", "MODERATOR", "ADMIN"], `/creator/${storyId}`);
  return <CreatorEditor storyId={storyId} />;
}
