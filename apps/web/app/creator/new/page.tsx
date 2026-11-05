import type { Metadata } from "next";
import { CreatorEditor } from "@/components/creator-workspace";
import { requireUserRole } from "@/lib/server-auth";

export const metadata: Metadata = { title: "Create a Story | StoryWorld" };

export default async function Page() {
  await requireUserRole(["CREATOR", "MODERATOR", "ADMIN"], "/creator/new");
  return <CreatorEditor />;
}
