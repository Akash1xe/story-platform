"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut, UserRound } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export function AuthNav() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState("");
  const role = session ? (session.user as { role?: string }).role ?? "READER" : "READER";

  async function handleSignOut() {
    setIsSigningOut(true);
    setError("");

    try {
      const result = await authClient.signOut();
      if (result.error) {
        setError(result.error.message ?? "Could not sign out. Please try again.");
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setError("Could not sign out. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  }

  if (isPending) {
    return <span className="auth-nav-loading" aria-label="Loading account" />;
  }

  if (!session) {
    return (
      <div className="auth-nav">
        <Link className="auth-sign-in" href="/sign-in">Sign in</Link>
        <Link className="creator-button auth-get-started" href="/sign-up">Create account</Link>
      </div>
    );
  }

  return (
    <div className="auth-nav auth-nav--signed-in">
      <span className="auth-user" title={session.user.email}>
        <UserRound size={15} aria-hidden="true" />
        <span>{session.user.name || session.user.email}</span>
        <small>{role}</small>
      </span>
      <button
        className="auth-sign-out"
        type="button"
        onClick={handleSignOut}
        disabled={isSigningOut}
      >
        <LogOut size={14} aria-hidden="true" />
        <span>{isSigningOut ? "Signing out…" : "Sign out"}</span>
      </button>
      {error && <span className="auth-nav-error" role="alert">{error}</span>}
    </div>
  );
}
