import type { Metadata } from "next";
import { CreatorReviewHistory } from "@/components/creator-review-history";
import { requireUserRole } from "@/lib/server-auth";

export const metadata: Metadata = {
  title: "Review History | StoryWorld",
  description: "Review moderator decisions and feedback on your StoryWorld submissions.",
};

export default async function Page() {
  await requireUserRole(["CREATOR", "MODERATOR", "ADMIN"], "/creator/reviews");
  return <CreatorReviewHistory />;
}
