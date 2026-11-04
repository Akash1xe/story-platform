import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PublicStoryReader from "@/components/public-story-reader";
import { getPublicChapter } from "@/lib/public-stories";

type PageProps = { params: Promise<{ slug: string; chapterNumber: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, chapterNumber } = await params;
  const number = Number(chapterNumber);
  if (!Number.isInteger(number) || number < 1) return { title: "Chapter not found | StoryWorld" };
  const data = await getPublicChapter(slug, number);
  if (!data) return { title: "Chapter not found | StoryWorld" };
  return {
    title: `${data.chapter.title} · ${data.story.title} | StoryWorld`,
    description: data.chapter.summary ?? `Read chapter ${number} of ${data.story.title}.`,
  };
}

export default async function PublicChapterPage({ params }: PageProps) {
  const { slug, chapterNumber } = await params;
  const number = Number(chapterNumber);
  if (!Number.isInteger(number) || number < 1) notFound();
  const data = await getPublicChapter(slug, number);
  if (!data) notFound();
  return <PublicStoryReader data={data} />;
}
