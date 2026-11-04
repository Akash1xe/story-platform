import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/server-auth";
import { safeReturnPath } from "@/lib/navigation";

export const metadata: Metadata = {
  title: "Sign in | StoryWorld",
  description: "Sign in to your StoryWorld account.",
};

type PageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function SignInPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const returnTo = safeReturnPath(params.next);

  if (await getCurrentUser()) {
    redirect(returnTo);
  }

  return <AuthForm mode="sign-in" returnTo={returnTo} />;
}
