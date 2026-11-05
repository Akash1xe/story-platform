"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, BookOpen, LoaderCircle } from "lucide-react";
import { authClient } from "@/lib/auth-client";

type AuthFormProps = {
  mode: "sign-in" | "sign-up";
  returnTo: string;
};

export function AuthForm({ mode, returnTo }: AuthFormProps) {
  const router = useRouter();
  const isSignUp = mode === "sign-up";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const result = isSignUp
        ? await authClient.signUp.email({
            name: name.trim(),
            email: email.trim(),
            password,
          })
        : await authClient.signIn.email({
            email: email.trim(),
            password,
          });

      if (result.error) {
        setError(result.error.message ?? "Authentication failed. Please try again.");
        return;
      }

      router.replace(returnTo);
      router.refresh();
    } catch {
      setError("The authentication service could not be reached. Check the API URL and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <Link className="auth-back-link" href="/">
        <ArrowLeft size={14} /> Back to StoryWorld
      </Link>

      <section className="auth-card">
        <Link href="/" className="brand auth-brand" aria-label="StoryWorld home">
          <span className="brand-icon"><BookOpen size={20} /></span>
          <span>StoryWorld<span className="brand-period">.</span></span>
        </Link>

        <span className="eyebrow">{isSignUp ? "START YOUR STORY" : "WELCOME BACK"}</span>
        <h1>{isSignUp ? "Create your account." : "Good to see you again."}</h1>
        <p className="auth-intro">
          {isSignUp
            ? "Join readers and creators discovering new worlds through stories."
            : "Sign in to continue reading and manage your StoryWorld account."}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isSignUp && (
            <label className="auth-field">
              <span>Display name</span>
              <input
                autoComplete="name"
                maxLength={60}
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="How readers will know you"
              />
            </label>
          )}

          <label className="auth-field">
            <span>Email address</span>
            <input
              autoComplete="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </label>

          <label className="auth-field">
            <span>Password</span>
            <input
              autoComplete={isSignUp ? "new-password" : "current-password"}
              type="password"
              minLength={8}
              maxLength={128}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={isSignUp ? "At least 8 characters" : "Your password"}
            />
          </label>

          {isSignUp && (
            <p className="auth-role-note">
              New accounts start with Reader access. Creator and moderator permissions are granted separately by an administrator.
            </p>
          )}

          {error && <p className="auth-error" role="alert">{error}</p>}

          <button className="auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? <LoaderCircle className="auth-spinner" size={16} /> : null}
            {isSubmitting
              ? (isSignUp ? "Creating account…" : "Signing in…")
              : (isSignUp ? "Create account" : "Sign in")}
            {!isSubmitting && <ArrowRight size={16} />}
          </button>
        </form>

        <p className="auth-switch">
          {isSignUp ? "Already have an account?" : "New to StoryWorld?"}{" "}
          <Link href={isSignUp ? `/sign-in?next=${encodeURIComponent(returnTo)}` : `/sign-up?next=${encodeURIComponent(returnTo)}`}>
            {isSignUp ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </section>

      <p className="auth-footnote">A home for comics, novels and stories worth sharing.</p>
    </main>
  );
}
