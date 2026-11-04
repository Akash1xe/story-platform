import type { Metadata } from "next";
import AdminReviewWorkspace from "@/components/admin-review-workspace";

export const metadata: Metadata = {
  title: "Admin Review Preview | StoryWorld",
  description: "Review creator submissions in the local StoryWorld moderation prototype."
};

export default function Page() {
  return <AdminReviewWorkspace />;
}
