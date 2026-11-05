import type { ReactNode } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";

type SiteHeaderActive =
  | "home"
  | "discover"
  | "genres"
  | "library"
  | "following"
  | "creator"
  | "studio"
  | "reviews"
  | "analytics"
  | "profile";

type SiteHeaderProps = {
  active?: SiteHeaderActive;
  variant?: "reader" | "creator";
  actions?: ReactNode;
  brandIcon?: ReactNode;
};

const readerNavigation = [
  { id: "home", href: "/", label: "Home" },
  { id: "discover", href: "/discover", label: "Discover" },
  { id: "genres", href: "/#genres", label: "Genres" },
  { id: "library", href: "/library", label: "My Library" },
  { id: "following", href: "/following", label: "Following" },
  { id: "creator", href: "/creator", label: "Creators" },
];

const creatorNavigation = [
  { id: "home", href: "/", label: "Home" },
  { id: "discover", href: "/discover", label: "Discover" },
  { id: "library", href: "/library", label: "My Library" },
  { id: "studio", href: "/creator", label: "Creator Studio" },
  { id: "reviews", href: "/creator/reviews", label: "Review history" },
  { id: "analytics", href: "/creator/analytics", label: "Analytics" },
  { id: "profile", href: "/creator/profile", label: "Profile settings" },
];

export function SiteHeader({
  active,
  variant = "reader",
  actions,
  brandIcon,
}: SiteHeaderProps) {
  const navigation = variant === "creator" ? creatorNavigation : readerNavigation;

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="brand" aria-label="StoryWorld home">
          <span className="brand-icon">{brandIcon ?? <BookOpen size={20} />}</span>
          <span>StoryWorld<span className="brand-period">.</span></span>
        </Link>
        <nav
          className="desktop-nav"
          aria-label={variant === "creator" ? "Creator navigation" : "Main navigation"}
        >
          {navigation.map((item) => {
            const isActive = item.id === active;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={isActive ? "nav-active" : undefined}
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="header-actions">{actions}</div>
      </div>
    </header>
  );
}
