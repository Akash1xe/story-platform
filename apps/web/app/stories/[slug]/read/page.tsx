import type { Metadata } from "next";
import { notFound } from "next/navigation";
import StoryReader from "@/components/story-reader";
import { allStories, getStoryBySlug } from "@/lib/demo-content";

type StoryReaderPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return allStories.map((story) => ({ slug: story.id }));
}

export async function generateMetadata({
  params
}: StoryReaderPageProps): Promise<Metadata> {
  const { slug } = await params;
  const story = getStoryBySlug(slug);

  if (!story) {
    return { title: "Story not found | StoryWorld" };
  }

  return {
    title: `Reading ${story.title} | StoryWorld`,
    description: `Read the sample ${story.type === "Comic" ? "episode" : "chapter"} of ${story.title}.`
  };
}

export default async function StoryReaderPage({
  params
}: StoryReaderPageProps) {
  const { slug } = await params;
  const story = getStoryBySlug(slug);

  if (!story) {
    notFound();
  }

  return <StoryReader story={story} />;
}
