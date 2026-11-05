"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import styles from "./notification-bell.module.css";

export default function NotificationBell() {
  const { data: session, isPending } = authClient.useSession();
  const sessionUserId = session?.user.id;
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isPending || !sessionUserId) {
      setUnreadCount(0);
      return;
    }

    let active = true;
    const refreshCount = () => {
      void fetch("/api/v1/notifications?limit=1", {
        credentials: "include",
        cache: "no-store",
        headers: { Accept: "application/json" },
      }).then(async (response) => {
        if (!response.ok) return null;
        return await response.json() as { unreadCount: number };
      }).then((result) => {
        if (active && result) setUnreadCount(result.unreadCount);
      }).catch(() => {
        if (active) setUnreadCount(0);
      });
    };

    refreshCount();
    window.addEventListener("focus", refreshCount);
    window.addEventListener("storyworld:notifications-updated", refreshCount);
    return () => {
      active = false;
      window.removeEventListener("focus", refreshCount);
      window.removeEventListener("storyworld:notifications-updated", refreshCount);
    };
  }, [isPending, sessionUserId]);

  if (isPending || !session) return null;

  return (
    <Link
      href="/notifications"
      className={styles.link}
      aria-label={unreadCount > 0 ? "Notifications, " + unreadCount + " unread" : "Notifications"}
      title="Notifications"
    >
      <Bell size={17} aria-hidden="true" />
      {unreadCount > 0 && <span className={styles.count}>{unreadCount > 99 ? "99+" : unreadCount}</span>}
    </Link>
  );
}
