import type { Metadata, Viewport } from "next";
import { ReaderLibraryProvider } from "@/hooks/use-reader-library";
import "./globals.css";

export const metadata: Metadata = {
  title: "StoryWorld — Discover Your Next Story",
  description: "Discover comics, novels and short stories from independent creators around the world.",
  applicationName: "StoryWorld"
};
export const viewport: Viewport = { themeColor: "#0d1017", colorScheme: "dark" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><ReaderLibraryProvider>{children}</ReaderLibraryProvider></body>
    </html>
  );
}
