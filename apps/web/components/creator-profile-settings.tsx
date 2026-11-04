"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, ExternalLink, LoaderCircle, Save, UserRound } from "lucide-react";
import { AuthNav } from "@/components/auth-nav";
import {
  getCreatorProfile,
  saveCreatorProfile,
  type CreatorProfileForm,
} from "@/lib/creator-profile-api";
import styles from "./creator-profile-settings.module.css";

const emptyProfile: CreatorProfileForm = {
  displayName: "",
  avatarUrl: "",
  handle: "",
  bio: "",
  websiteUrl: "",
};

export function CreatorProfileSettings() {
  const router = useRouter();
  const [profile, setProfile] = useState<CreatorProfileForm>(emptyProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    getCreatorProfile()
      .then((result) => {
        if (active) {
          setProfile({
            displayName: result.displayName,
            avatarUrl: result.avatarUrl ?? "",
            handle: result.handle,
            bio: result.bio ?? "",
            websiteUrl: result.websiteUrl ?? "",
          });
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Could not load your profile.");
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  function updateField(field: keyof CreatorProfileForm, value: string) {
    setProfile((current) => ({ ...current, [field]: value }));
    setNotice("");
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setNotice("");

    try {
      const saved = await saveCreatorProfile(profile);
      setProfile({
        displayName: saved.displayName,
        avatarUrl: saved.avatarUrl ?? "",
        handle: saved.handle,
        bio: saved.bio ?? "",
        websiteUrl: saved.websiteUrl ?? "",
      });
      setNotice("Your public creator profile has been saved.");
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save your profile.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <Link href="/" className="brand" aria-label="StoryWorld home">
            <span className="brand-icon"><UserRound size={20} /></span>
            <span>StoryWorld<span className="brand-period">.</span></span>
          </Link>
          <nav className="desktop-nav" aria-label="Creator navigation">
            <Link href="/">Home</Link>
            <Link href="/discover">Discover</Link>
            <Link href="/creator">Creator Studio</Link>
            <Link className="nav-active" href="/creator/profile">Profile settings</Link>
          </nav>
          <div className="header-actions"><AuthNav /></div>
        </div>
      </header>

      <main className={styles.shell}>
        <Link href="/creator" className={styles.back}><ArrowLeft size={14} /> Back to Creator Studio</Link>
        <section className={styles.hero}>
          <span className="eyebrow">YOUR PUBLIC IDENTITY</span>
          <h1>Creator profile</h1>
          <p>Set the name and details readers see when they discover your stories.</p>
        </section>

        {isLoading ? (
          <div className={styles.state}><LoaderCircle className={styles.spinner} size={20} /> Loading profile settings…</div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formIntro}>
              <div><h2>Profile details</h2><p>Your email and account role are never shown on the public profile.</p></div>
              <span className={styles.visibility}>Public profile</span>
            </div>

            <label className={styles.field}>
              <span>Public display name</span>
              <input value={profile.displayName} onChange={(event) => updateField("displayName", event.target.value)} minLength={2} maxLength={60} required />
              <small>2–60 characters.</small>
            </label>

            <label className={styles.field}>
              <span>Avatar image URL</span>
              <input type="url" value={profile.avatarUrl} onChange={(event) => updateField("avatarUrl", event.target.value)} maxLength={2048} placeholder="https://example.com/avatar.jpg" />
              <small>Use a publicly accessible HTTP or HTTPS image URL.</small>
            </label>

            <label className={styles.field}>
              <span>Creator handle</span>
              <div className={styles.handleInput}><span>@</span><input value={profile.handle} onChange={(event) => updateField("handle", event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").slice(0, 30))} minLength={3} maxLength={30} pattern="[a-z0-9](?:[a-z0-9-]*[a-z0-9])" required /></div>
              <small>3–30 lowercase letters, numbers or hyphens. Your public URL will use this handle.</small>
              {profile.handle && <Link className={styles.previewLink} href={"/creators/" + encodeURIComponent(profile.handle)} target="_blank">/creators/{profile.handle} <ExternalLink size={12} /></Link>}
            </label>

            <label className={styles.field}>
              <span>About you</span>
              <textarea value={profile.bio} onChange={(event) => updateField("bio", event.target.value)} rows={5} maxLength={500} placeholder="Tell readers what you create and what inspires your stories." />
              <small>{profile.bio.length}/500 characters.</small>
            </label>

            <label className={styles.field}>
              <span>Website</span>
              <input type="url" value={profile.websiteUrl} onChange={(event) => updateField("websiteUrl", event.target.value)} maxLength={2048} placeholder="https://your-website.com" />
              <small>Optional. Only HTTP and HTTPS links are accepted.</small>
            </label>

            {error && <p className={styles.error} role="alert">{error}</p>}
            {notice && <p className={styles.notice} role="status"><CheckCircle2 size={15} />{notice}</p>}
            <div className={styles.actions}>
              <Link className={styles.cancel} href="/creator">Cancel</Link>
              <button className={styles.save} type="submit" disabled={isSaving}>
                {isSaving ? <LoaderCircle className={styles.spinner} size={15} /> : <Save size={15} />}
                {isSaving ? "Saving…" : "Save profile"}
              </button>
            </div>
          </form>
        )}
      </main>
    </>
  );
}
