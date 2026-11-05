"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, Minus, Plus, Sun } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import type { PublicStoryPageData } from "@/lib/public-stories";
import ChapterComments from "@/components/chapter-comments";

type PublicStoryReaderProps = { data: PublicStoryPageData };
export default function PublicStoryReader({ data }: PublicStoryReaderProps) {
  const [fontScale, setFontScale] = useState(0);
  const [paperTheme, setPaperTheme] = useState(false);
  const { data: session, isPending } = authClient.useSession();
  const { story, chapter } = data;
  const isComic = story.format === "COMIC";

  useEffect(() => {
    if (isPending || !session) return;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let disposed = false;
    let lastSavedPercent = -1;

    const saveProgress = () => {
      const root = document.documentElement;
      const maxScroll = Math.max(0, root.scrollHeight - window.innerHeight);
      const ratio = maxScroll === 0 ? 0 : Math.min(1, Math.max(0, window.scrollY / maxScroll));
      const percent = Math.round(ratio * 100);
      if (percent === lastSavedPercent) return;
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        lastSavedPercent = percent;
        void fetch(`/api/v1/reading-progress/${encodeURIComponent(chapter.id)}`, {
          method: "PUT", credentials: "include",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ progressRatio: ratio }),
        });
      }, 900);
    };

    const attachListeners = () => {
      if (disposed) return;
      window.addEventListener("scroll", saveProgress, { passive: true });
      window.addEventListener("resize", saveProgress);
      saveProgress();
    };

    void fetch(`/api/v1/reading-progress/${encodeURIComponent(chapter.id)}`, {
      credentials: "include", cache: "no-store",
    }).then(async (response) => {
      if (!response.ok) return null;
      return await response.json() as { progress: { progressRatio: number } | null };
    }).then((result) => {
      if (disposed) return;
      const ratio = result?.progress?.progressRatio ?? 0;
      requestAnimationFrame(() => {
        if (disposed) return;
        const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        window.scrollTo({ top: maxScroll * ratio, behavior: "auto" });
        requestAnimationFrame(attachListeners);
      });
    }).catch(() => {
      attachListeners();
    });

    return () => {
      disposed = true;
      window.removeEventListener("scroll", saveProgress);
      window.removeEventListener("resize", saveProgress);
      if (timeout) clearTimeout(timeout);
    };
  }, [chapter.id, isPending, session]);

  return (
    <div className={paperTheme ? "reader-page reader-page--paper" : "reader-page"}>
      <header className="reader-toolbar"><div className="reader-toolbar-inner">
        <Link href={`/stories/${story.slug}`} className="reader-back-link"><ArrowLeft size={16} /><span>Story details</span></Link>
        <div className="reader-toolbar-title"><BookOpen size={17} /><span>{story.title}</span></div>
        <div className="reader-controls">
          {!isComic && <><button type="button" className="reader-control-button" aria-label="Decrease text size" disabled={fontScale <= -1} onClick={() => setFontScale((v) => Math.max(-1, v - 1))}><Minus size={15} /></button><span className="reader-size-label">Aa</span><button type="button" className="reader-control-button" aria-label="Increase text size" disabled={fontScale >= 2} onClick={() => setFontScale((v) => Math.min(2, v + 1))}><Plus size={15} /></button></>}
          <button type="button" className="reader-control-button reader-theme-button" onClick={() => setPaperTheme((v) => !v)} aria-pressed={paperTheme}><Sun size={15} /><span>{paperTheme ? "Dark" : "Paper"}</span></button>
        </div>
      </div></header>
      <main className={isComic ? "reader-main reader-main--comic" : "reader-main"}>
        <div className="reader-heading"><div className="reader-kicker">{isComic ? "COMIC EPISODE" : "CHAPTER"} <span>·</span> {String(chapter.number).padStart(2, "0")}</div><h1>{chapter.title}</h1><p>{story.title}</p></div>
        {isComic ? <section className="comic-reader" aria-label="Comic panels">{chapter.panels.map((panel) => <figure className="public-comic-panel" key={panel.id}><img src={panel.imageUrl} alt={panel.altText || (panel.caption ? "" : `${chapter.title}, panel ${panel.position}`)} loading="lazy" />{panel.caption && <figcaption>{panel.caption}</figcaption>}</figure>)}</section> : (
          <article className={`reader-prose reader-prose--scale-${fontScale}`} aria-label="Chapter text">{(chapter.body ?? "").split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => <p className={index === 0 ? "reader-prose-opening" : ""} key={index}>{paragraph}</p>)}</article>
        )}
        <nav className="public-reader-footer" aria-label="Chapter navigation">
          {data.navigation.previousChapter ? (
            <Link
              className="public-reader-chapter-link"
              href={`/stories/${story.slug}/read/${data.navigation.previousChapter.number}`}
              rel="prev"
            >
              <ArrowLeft size={17} aria-hidden="true" />
              <span>
                <small>PREVIOUS CHAPTER</small>
                <strong>{data.navigation.previousChapter.title}</strong>
              </span>
            </Link>
          ) : (
            <span className="public-reader-chapter-link public-reader-chapter-link--disabled">
              <ArrowLeft size={17} aria-hidden="true" />
              <span><small>YOU’RE AT THE</small><strong>First chapter</strong></span>
            </span>
          )}
          <Link className="public-reader-all-chapters" href={`/stories/${story.slug}`}>
            <BookOpen size={15} aria-hidden="true" />
            <span>All chapters</span>
          </Link>
          {data.navigation.nextChapter ? (
            <Link
              className="public-reader-chapter-link public-reader-chapter-link--next"
              href={`/stories/${story.slug}/read/${data.navigation.nextChapter.number}`}
              rel="next"
            >
              <span>
                <small>NEXT CHAPTER</small>
                <strong>{data.navigation.nextChapter.title}</strong>
              </span>
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          ) : (
            <span className="public-reader-chapter-link public-reader-chapter-link--next public-reader-chapter-link--disabled">
              <span><small>STORY COMPLETE</small><strong>You’re all caught up</strong></span>
              <ArrowRight size={17} aria-hidden="true" />
            </span>
          )}
        </nav>
        <ChapterComments slug={story.slug} chapterNumber={chapter.number} />
      </main>
    </div>
  );
}
