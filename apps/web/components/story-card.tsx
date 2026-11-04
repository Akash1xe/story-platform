"use client";

import { useState } from "react";
import { Bookmark, Clock3 } from "lucide-react";
import type { Story } from "@/lib/demo-content";

type StoryCardProps = {
  story: Story;
};

export default function StoryCard({ story }: StoryCardProps) {
  const [saved, setSaved] = useState(false);

  return (
    <article className="story-card">
      <div
        className="story-cover"
        style={{ backgroundImage: "url('" + story.coverImage + "')" }}
        role="img"
        aria-label={"Sample artwork for " + story.title}
      >
        <span className="cover-type">{story.type}</span>
        <button
          type="button"
          className={"save-button" + (saved ? " is-saved" : "")}
          aria-label={saved ? "Remove saved preview" : "Save story preview"}
          aria-pressed={saved}
          onClick={() => setSaved((current) => !current)}
        >
          <Bookmark size={16} fill={saved ? "currentColor" : "none"} />
        </button>
        <div className="cover-gradient" />
        <div className="cover-caption">
          <span>{story.genre}</span>
          <h3>{story.title}</h3>
        </div>
      </div>

      <div className="story-info">
        <span className="story-creator">by {story.creator}</span>
        <p>{story.description}</p>
        <div className="story-meta">
          <span>
            <Clock3 size={13} />
            {story.minutes} min read
          </span>
          <span>{story.type}</span>
        </div>
      </div>
    </article>
  );
}
