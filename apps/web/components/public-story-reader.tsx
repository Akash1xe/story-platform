"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Minus, Plus, Sun } from "lucide-react";
import type { PublicStoryPageData } from "@/lib/public-stories";

type PublicStoryReaderProps = {
  data: PublicStoryPageData;
};

export default function PublicStoryReader({ data }: PublicStoryReaderProps) {
  const [fontScale, setFontScale] = useState(0);
  const [paperTheme, setPaperTheme] = useState(false);
  const { story, chapter } = data;
  const isComic = story.format === "COMIC";

  return (
    <div className={paperTheme ? "reader-page reader-page--paper" : "reader-page"}>
      <header className="reader-toolbar">
        <div className="reader-toolbar-inner">
          <Link href={`/stories/${story.slug}`} className="reader-back-link">
            <ArrowLeft size={16} /><span>Story details</span>
          </Link>
          <div className="reader-toolbar-title"><BookOpen size={17} /><span>{story.title}</span></div>
          <div className="reader-controls">
            {!isComic && <>
              <button type="button" className="reader-control-button" aria-label="Decrease text size" disabled={fontScale <= -1} onClick={() => setFontScale((v) => Math.max(-1, v - 1))}><Minus size={15} /></button>
              <span className="reader-size-label">Aa</span>
              <button type="button" className="reader-control-button" aria-label="Increase text size" disabled={fontScale >= 2} onClick={() => setFontScale((v) => Math.min(2, v + 1))}><Plus size={15} /></button>
            </>}
            <button type="button" className="reader-control-button reader-theme-button" onClick={() => setPaperTheme((v) => !v)} aria-pressed={paperTheme}><Sun size={15} /><span>{paperTheme ? "Dark" : "Paper"}</span></button>
          </div>
        </div>
      </header>
      <main className={isComic ? "reader-main reader-main--comic" : "reader-main"}>
        <div className="reader-heading">
          <div className="reader-kicker">{isComic ? "COMIC EPISODE" : "CHAPTER"} <span>·</span> {String(chapter.number).padStart(2, "0")}</div>
          <h1>{chapter.title}</h1>
          <p>{story.title}</p>
        </div>
        {isComic ? (
          <section className="comic-reader" aria-label="Comic panels">
            {chapter.panels.map((panel) => (
              <figure className="public-comic-panel" key={panel.id}>
                <img src={panel.imageUrl} alt={panel.altText || panel.caption || `${chapter.title}, panel ${panel.position}`} loading="lazy" />
                {panel.caption && <figcaption>{panel.caption}</figcaption>}
              </figure>
            ))}
          </section>
        ) : (
          <article className={`reader-prose reader-prose--scale-${fontScale}`} aria-label="Chapter text">
            {(chapter.body ?? "").split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => (
              <p className={index === 0 ? "reader-prose-opening" : ""} key={index}>{paragraph}</p>
            ))}
          </article>
        )}
        <nav className="public-reader-footer" aria-label="Chapter navigation">
          <Link href={`/stories/${story.slug}`}>Back to all chapters <ArrowLeft size={15} /></Link>
        </nav>
      </main>
    </div>
  );
}
