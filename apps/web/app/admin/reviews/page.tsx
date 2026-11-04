import type { Metadata } from "next";
import AdminReviewWorkspace from "@/components/admin-review-workspace";
import { requireUserRole } from "@/lib/server-auth";

export const metadata: Metadata = {
  title: "Admin Review Preview | StoryWorld",
  description: "Review creator submissions in the StoryWorld moderation workspace."
};

export default async function Page() {
  await requireUserRole(["MODERATOR", "ADMIN"], "/admin/reviews");
  return <AdminReviewWorkspace />;
}
