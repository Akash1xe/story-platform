import type { Metadata } from "next";
import { CreatorProfileSettings } from "@/components/creator-profile-settings";
import { requireUserRole } from "@/lib/server-auth";

export const metadata: Metadata = {
  title: "Creator Profile Settings | StoryWorld",
  description: "Edit your public StoryWorld creator profile.",
};

export default async function CreatorProfilePage() {
  await requireUserRole(["CREATOR", "MODERATOR", "ADMIN"], "/creator/profile");
  return <CreatorProfileSettings />;
}
