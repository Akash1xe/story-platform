"use client";

import { useEffect } from "react";

type ReadingProgressResponse = {
  progress?: { progressRatio?: number } | null;
};

const SAVE_DEBOUNCE_MS = 900;
const RESTORE_POLL_MS = 150;
const RESTORE_MIN_WAIT_MS = 350;
const RESTORE_LAYOUT_QUIET_MS = 850;
const RESTORE_MAX_WAIT_MS = 10_000;
const IMAGE_PREFETCH_VIEWPORTS = 2;

function clampProgressRatio(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function hasPendingImagesNearViewport(container: HTMLElement): boolean {
  return Array.from(container.querySelectorAll("img")).some((image) => {
    if (image.complete) return false;

    const bounds = image.getBoundingClientRect();
    const buffer = window.innerHeight * IMAGE_PREFETCH_VIEWPORTS;

    return bounds.bottom >= -buffer && bounds.top <= window.innerHeight + buffer;
  });
}

export function useReadingProgress(
  chapterId: string,
  isComic: boolean,
  enabled: boolean,
): void {
  useEffect(() => {
    if (!enabled) return;

    let disposed = false;
    let restorationFinished = false;
    let progressListenersAttached = false;
    let saveTimeout: ReturnType<typeof setTimeout> | undefined;
    let restorePoll: ReturnType<typeof setInterval> | undefined;
    let restoreFrame: number | undefined;
    let lastSavedPercent = -1;
    let restoreContainer: HTMLElement | null = null;
    let resizeObserver: ResizeObserver | undefined;
    let lastLayoutChangeAt = 0;
    let restoreStartedAt = 0;
    let activeRestoreRatio = 0;
    const requestedImages = new Set<HTMLImageElement>();

    const saveProgress = () => {
      const root = document.documentElement;
      const maxScroll = Math.max(0, root.scrollHeight - window.innerHeight);
      const ratio = maxScroll === 0
        ? 0
        : Math.min(1, Math.max(0, window.scrollY / maxScroll));
      const percent = Math.round(ratio * 100);

      if (percent === lastSavedPercent) return;
      if (saveTimeout) clearTimeout(saveTimeout);

      saveTimeout = setTimeout(() => {
        if (disposed) return;
        lastSavedPercent = percent;
        void fetch(`/api/v1/reading-progress/${encodeURIComponent(chapterId)}`, {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ progressRatio: ratio }),
        });
      }, SAVE_DEBOUNCE_MS);
    };

    const removeInteractionListeners = () => {
      window.removeEventListener("wheel", finishRestoration);
      window.removeEventListener("touchmove", finishRestoration);
      window.removeEventListener("keydown", handleScrollKeyDown);
    };

    const attachProgressListeners = () => {
      if (disposed || progressListenersAttached) return;
      progressListenersAttached = true;
      window.addEventListener("scroll", saveProgress, { passive: true });
      window.addEventListener("resize", saveProgress);
      saveProgress();
    };

    const finishRestoration = () => {
      if (restorationFinished) return;
      restorationFinished = true;

      if (restorePoll) clearInterval(restorePoll);
      if (restoreFrame !== undefined) {
        cancelAnimationFrame(restoreFrame);
        restoreFrame = undefined;
      }

      resizeObserver?.disconnect();
      resizeObserver = undefined;
      if (restoreContainer) {
        restoreContainer.removeEventListener("load", handleImageSettlement, true);
        restoreContainer.removeEventListener("error", handleImageSettlement, true);
      }
      restoreContainer = null;
      requestedImages.clear();

      removeInteractionListeners();
      attachProgressListeners();
    };

    function handleScrollKeyDown(event: KeyboardEvent) {
      const scrollKeys = [
        "ArrowDown",
        "ArrowUp",
        "PageDown",
        "PageUp",
        "Home",
        "End",
        " ",
      ];
      if (!scrollKeys.includes(event.key)) return;

      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT")
      ) {
        return;
      }

      finishRestoration();
    }

    const requestImagesBeforeTarget = (container: HTMLElement, targetY: number) => {
      const prefetchDistance = window.innerHeight * IMAGE_PREFETCH_VIEWPORTS;

      for (const image of Array.from(container.querySelectorAll("img"))) {
        if (image.complete) continue;

        const documentTop = image.getBoundingClientRect().top + window.scrollY;
        if (documentTop > targetY + prefetchDistance) continue;

        requestedImages.add(image);
        image.loading = "eager";
      }
    };

    const scheduleRestore = (ratio: number) => {
      if (restoreFrame !== undefined || restorationFinished) return;

      restoreFrame = requestAnimationFrame(() => {
        restoreFrame = undefined;
        if (disposed || restorationFinished) return;

        const maxScroll = Math.max(
          0,
          document.documentElement.scrollHeight - window.innerHeight,
        );
        const targetY = maxScroll * ratio;

        if (restoreContainer) {
          // Load panels above the moving target so their heights are included
          // before the saved percentage is calculated again.
          requestImagesBeforeTarget(restoreContainer, targetY);
        }

        window.scrollTo({ top: targetY, behavior: "auto" });
      });
    };

    const handleImageSettlement = (event: Event) => {
      if (!(event.target instanceof HTMLImageElement)) return;
      if (!restoreContainer?.contains(event.target)) return;

      requestedImages.delete(event.target);
      lastLayoutChangeAt = Date.now();
      scheduleRestore(activeRestoreRatio);
    };

    const startComicRestoration = (ratio: number) => {
      const container = document.querySelector<HTMLElement>(".reader-main");
      if (!container) {
        scheduleRestore(ratio);
        requestAnimationFrame(finishRestoration);
        return;
      }

      activeRestoreRatio = ratio;
      restoreContainer = container;
      restoreStartedAt = Date.now();
      lastLayoutChangeAt = restoreStartedAt;

      container.addEventListener("load", handleImageSettlement, true);
      container.addEventListener("error", handleImageSettlement, true);

      if (typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(() => {
          lastLayoutChangeAt = Date.now();
          scheduleRestore(ratio);
        });
        resizeObserver.observe(container);
      }

      scheduleRestore(ratio);
      restorePoll = setInterval(() => {
        if (disposed || restorationFinished) return;

        const elapsed = Date.now() - restoreStartedAt;
        if (elapsed >= RESTORE_MAX_WAIT_MS) {
          finishRestoration();
          return;
        }

        const minimumWaitPassed = elapsed >= RESTORE_MIN_WAIT_MS;
        const layoutIsQuiet =
          Date.now() - lastLayoutChangeAt >= RESTORE_LAYOUT_QUIET_MS;
        const requestedImagesSettled = Array.from(requestedImages).every(
          (image) => image.complete,
        );
        const visibleImagesSettled = !hasPendingImagesNearViewport(container);

        if (
          minimumWaitPassed &&
          layoutIsQuiet &&
          requestedImagesSettled &&
          visibleImagesSettled
        ) {
          finishRestoration();
        }
      }, RESTORE_POLL_MS);
    };

    window.addEventListener("wheel", finishRestoration, { passive: true });
    window.addEventListener("touchmove", finishRestoration, { passive: true });
    window.addEventListener("keydown", handleScrollKeyDown);

    void fetch(`/api/v1/reading-progress/${encodeURIComponent(chapterId)}`, {
      credentials: "include",
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) return null;
        return await response.json() as ReadingProgressResponse;
      })
      .then((result) => {
        if (disposed || restorationFinished) return;

        const ratio = clampProgressRatio(result?.progress?.progressRatio);
        if (isComic && ratio > 0) {
          startComicRestoration(ratio);
          return;
        }

        scheduleRestore(ratio);
        requestAnimationFrame(finishRestoration);
      })
      .catch(() => {
        finishRestoration();
      });

    return () => {
      disposed = true;
      if (saveTimeout) clearTimeout(saveTimeout);
      if (restorePoll) clearInterval(restorePoll);
      if (restoreFrame !== undefined) cancelAnimationFrame(restoreFrame);

      resizeObserver?.disconnect();
      restoreContainer?.removeEventListener("load", handleImageSettlement, true);
      restoreContainer?.removeEventListener("error", handleImageSettlement, true);

      removeInteractionListeners();
      window.removeEventListener("scroll", saveProgress);
      window.removeEventListener("resize", saveProgress);
    };
  }, [chapterId, enabled, isComic]);
}
