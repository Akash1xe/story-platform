import type { Metadata } from "next";
import { CreatorAnalytics } from "@/components/creator-analytics";
import { requireUserRole } from "@/lib/server-auth";

export const metadata: Metadata = {
  title: "Creator Analytics | StoryWorld",
  description: "Understand saved reading progress, library saves and followers for your StoryWorld stories.",
};

export default async function Page() {
  await requireUserRole(["CREATOR", "MODERATOR", "ADMIN"], "/creator/analytics");
  return <CreatorAnalytics />;
}
