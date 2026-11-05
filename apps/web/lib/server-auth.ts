import { headers } from "next/headers";
import { redirect } from "next/navigation";

export type PlatformRole = "READER" | "CREATOR" | "MODERATOR" | "ADMIN";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: PlatformRole;
};

type MeResponse = {
  user?: CurrentUser;
};

function getApiServerUrl(): string {
  return process.env.API_SERVER_URL?.replace(/\/$/, "") ?? "http://localhost:4000";
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const requestHeaders = await headers();
    const cookie = requestHeaders.get("cookie");

    const response = await fetch(`${getApiServerUrl()}/api/v1/me`, {
      method: "GET",
      headers: cookie ? { cookie } : undefined,
      cache: "no-store",
    });

    if (!response.ok) return null;

    const result = (await response.json()) as MeResponse;
    return result.user ?? null;
  } catch {
    return null;
  }
}

export async function requireUserRole(
  allowedRoles: PlatformRole[],
  returnTo: string,
): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/sign-in?next=${encodeURIComponent(returnTo)}`);
  }

  if (!allowedRoles.includes(user.role)) {
    redirect("/access-denied");
  }

  return user;
}
