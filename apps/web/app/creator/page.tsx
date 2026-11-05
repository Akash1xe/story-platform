import type { Metadata } from "next";
import { CreatorStudio } from "@/components/creator-workspace";
import { requireUserRole } from "@/lib/server-auth";

export const metadata: Metadata = {
  title: "Creator Studio | StoryWorld",
  description: "Create comics, novels and short stories on StoryWorld."
};

export default async function Page() {
  await requireUserRole(["CREATOR", "MODERATOR", "ADMIN"], "/creator");
  return <CreatorStudio />;
}
