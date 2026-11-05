import { notFound, redirect } from "next/navigation";
import { getPublicStory } from "@/lib/public-stories";

type PageProps = { params: Promise<{ slug: string }> };

export default async function StoryReaderLandingPage({ params }: PageProps) {
  const { slug } = await params;
  const result = await getPublicStory(slug);
  if (!result) notFound();
  const firstChapter = result.story.chapters[0];
  if (!firstChapter) notFound();
  redirect(`/stories/${slug}/read/${firstChapter.number}`);
}
