import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { getCurrentUser } from "@/lib/server-auth";

export const metadata: Metadata = {
  title: "Access unavailable | StoryWorld",
  description: "Your account does not have permission to open this workspace.",
};

export default async function AccessDeniedPage() {
  const user = await getCurrentUser();

  return (
    <main className="auth-page">
      <section className="auth-card auth-card--message">
        <span className="auth-message-icon"><ShieldAlert size={25} /></span>
        <span className="eyebrow">ACCOUNT PERMISSIONS</span>
        <h1>This workspace isn't available yet.</h1>
        <p className="auth-intro">
          {user
            ? `You are signed in as ${user.email} with the ${user.role} role. Creator Studio requires creator access, and the moderation queue requires moderator or admin access.`
            : "Sign in with an account that has the required workspace permissions."}
        </p>
        <p className="auth-role-note">
          New accounts start as Readers. Elevated roles must be granted through a trusted administrative process.
        </p>
        <div className="auth-message-actions">
          <Link className="auth-submit" href="/">Return home</Link>
          {!user && <Link className="button-secondary" href="/sign-in">Sign in</Link>}
        </div>
      </section>
    </main>
  );
}
