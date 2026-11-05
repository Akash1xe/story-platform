import Link from "next/link";
import { Bookmark, BookOpen, Clock3, Compass, Sparkles, UserRound } from "lucide-react";

type MobileNavigationProps = {
  active: "home" | "discover";
};

const homeItems = [
  { id: "home", href: "#home", label: "Home", icon: BookOpen },
  { id: "discover", href: "/discover", label: "Discover", icon: Compass },
  { id: "library", href: "/library", label: "My Library", icon: Bookmark },
  { id: "creator", href: "/creator", label: "Creator", icon: UserRound },
] as const;

const discoverItems = [
  { id: "home", href: "/", label: "Home", icon: BookOpen },
  { id: "discover", href: "/discover", label: "Discover", icon: Compass },
  { id: "library", href: "/library", label: "My Library", icon: Clock3 },
  { id: "create", href: "/#creator", label: "Create", icon: Sparkles },
] as const;

export function MobileNavigation({ active }: MobileNavigationProps) {
  const items = active === "home" ? homeItems : discoverItems;

  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      {items.map(({ id, href, label, icon: Icon }) => {
        const isActive = id === active;
        return (
          <Link
            key={id}
            href={href}
            className={isActive ? "mobile-nav-active" : undefined}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon size={19} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
