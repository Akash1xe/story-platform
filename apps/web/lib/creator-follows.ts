export type FollowedStory = {
  id: string;
  slug: string;
  title: string;
  coverImageUrl: string | null;
};

export type FollowedCreator = {
  followedAt: string;
  creator: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    creatorHandle: string | null;
    creatorBio: string | null;
    followersCount: number;
    stories: FollowedStory[];
  };
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: "include",
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null) as
    | (T & { error?: { message?: string } })
    | null;
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? "Could not load your followed creators.");
  }
  return payload as T;
}

export function listFollowedCreators() {
  return request<{ following: FollowedCreator[] }>("/api/v1/following");
}

export function unfollowCreator(creatorId: string) {
  return request<{ following: boolean; followersCount: number }>(
    "/api/v1/following/" + encodeURIComponent(creatorId),
    { method: "DELETE" },
  );
}
