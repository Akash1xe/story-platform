import type { Metadata } from "next";
import NotificationsPage from "@/components/notifications-page";
import { requireUserRole } from "@/lib/server-auth";

export const metadata: Metadata = {
  title: "Notifications | StoryWorld",
  description: "Updates from creators you follow on StoryWorld.",
};

export default async function Page() {
  await requireUserRole(["READER", "CREATOR", "MODERATOR", "ADMIN"], "/notifications");
  return <NotificationsPage />;
}
