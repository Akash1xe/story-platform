"use client";

import { fromApiStory, type ApiStory } from "@/lib/creator-api";
import type { CreatorStory } from "@/lib/creator-content";

export type ModerationFilter = "Pending" | "Reviewed" | "All";
export type ModerationDecision = "APPROVED" | "CHANGES_REQUESTED";

async function moderationRequest<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(path, {
      ...init,
      credentials: "include",
      cache: "no-store",
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new Error("Could not reach the StoryWorld API. Check that the API server is running.");
  }

  const payload = (await response.json().catch(() => null)) as
    | { error?: { message?: string } }
    | null;

  if (!response.ok) {
    throw new Error(
      payload?.error?.message ??
        (response.status === 401
          ? "Your session has expired. Sign in again."
          : "The moderation request could not be completed."),
    );
  }

  return payload as T;
}

export async function listModerationSubmissions(
  filter: ModerationFilter = "All",
): Promise<CreatorStory[]> {
  const payload = await moderationRequest<{ submissions: ApiStory[] }>(
    `/api/v1/moderation/reviews?filter=${filter}`,
  );
  return payload.submissions.map(fromApiStory);
}

export async function decideModerationSubmission(
  storyId: string,
  decision: ModerationDecision,
  note: string,
): Promise<CreatorStory> {
  const payload = await moderationRequest<{ submission: ApiStory }>(
    `/api/v1/moderation/reviews/${encodeURIComponent(storyId)}/decision`,
    {
      method: "POST",
      body: JSON.stringify({ decision, note }),
    },
  );

  return fromApiStory(payload.submission);
}
