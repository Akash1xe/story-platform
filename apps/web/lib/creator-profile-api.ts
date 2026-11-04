export type CreatorProfileForm = {
  displayName: string;
  avatarUrl: string;
  handle: string;
  bio: string;
  websiteUrl: string;
};

type CreatorProfileRecord = Omit<CreatorProfileForm, "avatarUrl"> & {
  avatarUrl: string | null;
  userId: string;
  joinedAt: string;
};

type CreatorProfileResponse = {
  profile: CreatorProfileRecord;
};

const ENDPOINT = "/api/v1/creator/profile";

async function requestProfile(
  method: "GET" | "PUT",
  body?: CreatorProfileForm,
): Promise<CreatorProfileRecord> {
  let response: Response;

  try {
    response = await fetch(ENDPOINT, {
      method,
      credentials: "include",
      cache: "no-store",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Could not reach the StoryWorld API. Check that the API server is running.");
  }

  const payload = (await response.json().catch(() => null)) as
    | { profile?: CreatorProfileResponse["profile"]; error?: { message?: string } }
    | null;

  if (!response.ok || !payload?.profile) {
    throw new Error(
      payload?.error?.message ??
        (response.status === 401
          ? "Your session has expired. Sign in again."
          : "Your creator profile could not be loaded. Please try again."),
    );
  }

  return payload.profile;
}

export function getCreatorProfile() {
  return requestProfile("GET");
}

export function saveCreatorProfile(profile: CreatorProfileForm) {
  return requestProfile("PUT", profile);
}
