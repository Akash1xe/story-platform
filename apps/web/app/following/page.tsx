import type { Metadata } from "next";
import FollowingPage from "@/components/following-page";
import { requireUserRole } from "@/lib/server-auth";

export const metadata: Metadata = {
  title: "Following | StoryWorld",
  description: "Keep up with the creators you follow and their latest published stories.",
};

export default async function Page() {
  await requireUserRole(["READER", "CREATOR", "MODERATOR", "ADMIN"], "/following");
  return <FollowingPage />;
}
