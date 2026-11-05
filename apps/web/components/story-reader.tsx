"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Check,
  Minus,
  Plus,
  Sun
} from "lucide-react";
import type { Story } from "@/lib/demo-content";
import { useReaderLibrary } from "@/hooks/use-reader-library";

type StoryReaderProps = {
  story: Story;
};

export default function StoryReader({ story }: StoryReaderProps) {
  const [fontScale, setFontScale] = useState(0);
  const [paperTheme, setPaperTheme] = useState(false);
  const [progress, setProgress] = useState(0);
  const didRestoreProgress = useRef(false);
  const { library, isReady, recordReadingProgress } = useReaderLibrary();

  useEffect(() => {
    if (!isReady || didRestoreProgress.current) return;

    didRestoreProgress.current = true;
    const savedPercent = library.progress[story.id]?.percent ?? 0;
    setProgress(savedPercent);

    if (savedPercent > 0) {
      window.requestAnimationFrame(() => {
        const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo(0, (savedPercent / 100) * scrollableHeight);
      });
    }
  }, [isReady, library.progress, story.id]);

  useEffect(() => {
    const updateProgress = () => {
      const scrollableHeight =
        document.documentElement.scrollHeight - window.innerHeight;

      if (scrollableHeight <= 0) {
        setProgress(100);
        return;
      }

      const nextProgress = Math.round(
        (window.scrollY / scrollableHeight) * 100
      );
      setProgress(Math.min(100, Math.max(0, nextProgress)));
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });

    return () => window.removeEventListener("scroll", updateProgress);
  }, []);

  useEffect(() => {
    if (!isReady || !didRestoreProgress.current || progress <= 0) return;
    recordReadingProgress(story.id, progress);
  }, [isReady, progress, recordReadingProgress, story.id]);

  const isComic = story.type === "Comic" && Boolean(story.comicPanels?.length);

  return (
    <div className={paperTheme ? "reader-page reader-page--paper" : "reader-page"}>
      <header className="reader-toolbar">
        <div className="reader-toolbar-inner">
          <Link href={`/stories/${story.id}`} className="reader-back-link">
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Story details</span>
          </Link>

          <div className="reader-toolbar-title">
            <BookOpen size={17} aria-hidden="true" />
            <span>{story.title}</span>
          </div>

          <div className="reader-controls">
            {!isComic && (
              <>
                <button
                  type="button"
                  className="reader-control-button"
                  aria-label="Decrease text size"
                  disabled={fontScale === -1}
                  onClick={() => setFontScale((current) => Math.max(-1, current - 1))}
                >
                  <Minus size={15} />
                </button>
                <span className="reader-size-label">Aa</span>
                <button
                  type="button"
                  className="reader-control-button"
                  aria-label="Increase text size"
                  disabled={fontScale === 2}
                  onClick={() => setFontScale((current) => Math.min(2, current + 1))}
                >
                  <Plus size={15} />
                </button>
              </>
            )}
            <button
              type="button"
              className="reader-control-button reader-theme-button"
              onClick={() => setPaperTheme((current) => !current)}
              aria-label={paperTheme ? "Switch to dark reading theme" : "Switch to paper reading theme"}
              aria-pressed={paperTheme}
            >
              <Sun size={15} />
              <span>{paperTheme ? "Dark" : "Paper"}</span>
            </button>
          </div>
        </div>
        <div
          className="reader-progress-track"
          role="progressbar"
          aria-label="Reading progress on this page"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
      </header>

      <main className={isComic ? "reader-main reader-main--comic" : "reader-main"}>
        <div className="reader-heading">
          <div className="reader-kicker">
            {isComic ? "SAMPLE EPISODE" : "SAMPLE CHAPTER"}
            <span aria-hidden="true">·</span>
            {story.genre}
          </div>
          <h1>{story.previewTitle}</h1>
          <p>
            {story.title} <span aria-hidden="true">·</span> by {story.creator}
          </p>
        </div>

        {isComic ? (
          <section className="comic-reader" aria-label="Comic episode panels">
            <div className="comic-reader-note">
              <span>VISUAL STORYBOARD PREVIEW</span>
              <span>{story.comicPanels?.length ?? 0} panels</span>
            </div>
            {story.comicPanels?.map((panel, index) => (
              <article className="comic-panel" key={panel.id}>
                <div className={`comic-panel-art comic-panel-art--${panel.style}`}>
                  <span className="comic-panel-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="comic-panel-scene">{panel.scene}</p>
                </div>
                {panel.caption && (
                  <p className="comic-panel-caption">{panel.caption}</p>
                )}
                {panel.dialogue && (
                  <div className="comic-dialogue">{panel.dialogue}</div>
                )}
              </article>
            ))}
          </section>
        ) : (
          <article
            className={`reader-prose reader-prose--scale-${fontScale}`}
            aria-label="Story text"
          >
            {story.previewParagraphs.map((paragraph, index) => (
              <p
                className={index === 0 ? "reader-prose-opening" : ""}
                key={paragraph}
              >
                {paragraph}
              </p>
            ))}
            <div className="reader-chapter-end">
              <span />
              END OF SAMPLE CHAPTER
              <span />
            </div>
          </article>
        )}

        <section className="reader-end-card">
          <div className="reader-end-icon">
            <Check size={19} />
          </div>
          <div>
            <span className="reader-kicker">YOU'VE REACHED THE END</span>
            <h2>That was the sample.</h2>
            <p>
              This is original preview content created for the StoryWorld interface.
              Full chapters and creator publishing will come later.
            </p>
          </div>
          <Link href={`/stories/${story.id}`} className="reader-end-link">
            Back to story <ArrowLeft size={15} />
          </Link>
        </section>
      </main>
    </div>
  );
}
