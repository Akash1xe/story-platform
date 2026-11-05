import type { Metadata } from "next";
import ContentReportsPage from "@/components/content-reports-page";
import { requireUserRole } from "@/lib/server-auth";

export const metadata: Metadata = {
  title: "Content Reports | StoryWorld",
  description: "Review reader reports about published stories and chapter comments.",
};

export default async function Page() {
  await requireUserRole(["MODERATOR", "ADMIN"], "/admin/reports");
  return <ContentReportsPage />;
}
