"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Flag, Send, X } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import styles from "./content-report-button.module.css";

type ReportTargetType = "STORY" | "CHAPTER_COMMENT";
type ReportReason =
  | "SPAM"
  | "HARASSMENT"
  | "HATE_SPEECH"
  | "SEXUAL_CONTENT"
  | "VIOLENCE"
  | "COPYRIGHT"
  | "OTHER";

const REASONS: Array<{ value: ReportReason; label: string }> = [
  { value: "SPAM", label: "Spam or misleading" },
  { value: "HARASSMENT", label: "Harassment or bullying" },
  { value: "HATE_SPEECH", label: "Hate speech" },
  { value: "SEXUAL_CONTENT", label: "Sexual content" },
  { value: "VIOLENCE", label: "Graphic or violent content" },
  { value: "COPYRIGHT", label: "Copyright violation" },
  { value: "OTHER", label: "Other" },
];

type ContentReportButtonProps = {
  targetType: ReportTargetType;
  targetId: string;
  ownerId?: string;
};

async function errorMessage(response: Response) {
  try {
    const payload = await response.json() as { error?: { message?: string } };
    return payload.error?.message ?? "The report could not be submitted.";
  } catch {
    return "The report could not be submitted.";
  }
}

export default function ContentReportButton({ targetType, targetId, ownerId }: ContentReportButtonProps) {
  const { data: session, isPending } = authClient.useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("OTHER");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/v1/reports", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ targetType, targetId, reason, details: details.trim() }),
      });
      if (!response.ok) throw new Error(await errorMessage(response));
      setSubmitted(true);
      setDetails("");
    } catch (reasonError) {
      setError(reasonError instanceof Error ? reasonError.message : "The report could not be submitted.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isPending) return null;
  if (session && ownerId === session.user.id) return null;

  if (!session) {
    return <Link className={styles.trigger} href="/sign-in"><Flag size={13} /> Report</Link>;
  }

  return (
    <div className={styles.root}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => { setIsOpen((current) => !current); setError(""); }}
        aria-expanded={isOpen}
      >
        <Flag size={13} /> Report
      </button>
      {isOpen && (
        <div className={styles.panel}>
          <div className={styles.panelHeading}>
            <div><strong>Report this {targetType === "STORY" ? "story" : "comment"}</strong><span>Reports are reviewed by the StoryWorld moderation team.</span></div>
            <button type="button" aria-label="Close report form" onClick={() => setIsOpen(false)}><X size={15} /></button>
          </div>
          {submitted ? (
            <div className={styles.success} role="status">Thanks. Your report has been sent to the moderation team.</div>
          ) : (
            <form onSubmit={submit}>
              <label>
                <span>Reason</span>
                <select value={reason} onChange={(event) => setReason(event.target.value as ReportReason)}>
                  {REASONS.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}
                </select>
              </label>
              <label>
                <span>Additional details <small>(optional)</small></span>
                <textarea value={details} onChange={(event) => setDetails(event.target.value)} rows={3} maxLength={1000} placeholder="Tell the moderators what they should look at..." />
              </label>
              {error && <p className={styles.error} role="alert">{error}</p>}
              <div className={styles.footer}>
                <span>{details.length}/1000</span>
                <button type="submit" disabled={isSubmitting}><Send size={13} /> {isSubmitting ? "Sending…" : "Submit report"}</button>
              </div>
            </form>
          )}
          {submitted && <button type="button" className={styles.closeSuccess} onClick={() => setIsOpen(false)}>Close</button>}
        </div>
      )}
    </div>
  );
}
