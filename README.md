# Story Platform

A creator-driven storytelling platform for comics, novels, and short stories.

The repository uses a pnpm workspace with a Next.js website and an Express API.

## Requirements

- Node.js 20.19 or newer
- pnpm 10 or newer
- Docker with Docker Compose (for the local PostgreSQL service)

## Getting started

Install dependencies:

```bash
pnpm install
```

## Start the API and database

Start PostgreSQL:

```bash
docker compose up -d postgres
```

Copy the API environment template:

```bash
cp apps/api/.env.example apps/api/.env
```

Replace `BETTER_AUTH_SECRET` with a fresh secret of at least 32 characters:

```bash
openssl rand -base64 32
```

Generate the Prisma client and sync the current schema into a fresh local database:

```bash
pnpm --filter @story-platform/api db:generate
pnpm --filter @story-platform/api exec prisma db push
pnpm --filter @story-platform/api exec prisma migrate resolve --applied 20261105000000_add_creator_follows
pnpm --filter @story-platform/api exec prisma migrate resolve --applied 20261105010000_add_creator_profile_fields
pnpm --filter @story-platform/api exec prisma migrate resolve --applied 20261105020000_add_chapter_comments
pnpm --filter @story-platform/api exec prisma migrate resolve --applied 20261105030000_add_notifications
pnpm --filter @story-platform/api exec prisma migrate resolve --applied 20261105040000_add_content_reports
pnpm --filter @story-platform/api exec prisma migrate resolve --applied 20261105050000_add_content_moderation_actions
pnpm --filter @story-platform/api exec prisma migrate resolve --applied 20261105060000_add_story_ratings
```

The repository currently tracks incremental feature migrations, not a complete baseline migration. The `db push` step creates all tables from the current Prisma schema; the seven `migrate resolve` commands record the already-created feature structures so later deployments do not try to create them again. For an existing database that already has the base StoryWorld tables, apply pending committed migrations with `pnpm db:deploy`.

Start the API:

```bash
pnpm dev:api
```

The API listens on `http://localhost:4000`.

## Start the website

Copy `apps/web/.env.example` to `apps/web/.env.local`. For local development, the API server URL is `http://localhost:4000`.

```bash
pnpm dev:web
```

The website listens on `http://localhost:3000`.

## Authentication and account roles

Better Auth is mounted at `/api/auth/*` and provides email/password sign-up, sign-in, sign-out and session endpoints.

- `GET /api/v1/health` checks the API process.
- `GET /api/v1/ready` checks PostgreSQL connectivity.
- `GET /api/v1/me` returns the signed-in user and session.
- `GET /api/v1/creator/stories` lists the signed-in creator's stories.
- `POST /api/v1/creator/stories` creates a story draft.
- `GET /api/v1/creator/stories/:storyId` loads one owned story and its chapters.
- `GET /api/v1/creator/stories/reviews` lists the signed-in creator’s moderation decisions and feedback with pagination.
- `GET /api/v1/creator/stories/analytics` returns aggregate readership, recent active reader accounts, followers, library saves and per-story metrics.
- `GET /api/v1/ratings/:storySlug` returns a public average and rating count; signed-in readers can load their own rating with `GET /api/v1/ratings/:storySlug/me`, update it with `PUT`, or remove it with `DELETE`.
- `PUT /api/v1/creator/stories/:storyId` saves a draft and replaces its ordered chapter/panel content.
- `POST /api/v1/creator/stories/:storyId/submit` validates and submits a draft for moderation.
- `GET /api/v1/moderation/reviews` lists submissions for moderators and admins.
- `GET /api/v1/library` lists the signed-in reader’s saved published stories.
- `POST /api/v1/library/:storySlug` saves a published story; `DELETE` removes it.
- `GET /api/v1/reading-progress` lists the reader’s latest chapter progress.
- `GET /api/v1/reading-progress/:chapterId` loads the saved position for a chapter.
- `GET /api/v1/creators/:creatorId` returns a public creator profile and their published stories; the path accepts the creator ID or their custom handle.
- `GET /api/v1/following` lists creators followed by the signed-in reader.
- `GET /api/v1/following/:creatorId` checks follow status.
- `POST /api/v1/following/:creatorId` follows a creator with published work.
- `DELETE /api/v1/following/:creatorId` unfollows a creator.
- `GET /api/v1/creator/profile` loads the signed-in creator’s profile settings.
- `PUT /api/v1/creator/profile` updates the signed-in creator’s public name, avatar URL, unique handle, biography and website URL.
- `PUT /api/v1/reading-progress/:chapterId` upserts progress for a published chapter (ratio from 0 to 1).
- `GET /api/v1/stories/:slug/chapters/:chapterNumber/comments` lists public chapter comments (20 per page by default, up to 50).
- `POST /api/v1/stories/:slug/chapters/:chapterNumber/comments` adds a comment to a published chapter for a signed-in reader (1–1500 characters).
- `PATCH /api/v1/chapter-comments/:commentId` edits the signed-in author’s own comment; `DELETE` removes it.
- `GET /api/v1/notifications` lists the signed-in reader’s latest notifications and unread count.
- `PATCH /api/v1/notifications/:notificationId/read` marks one notification as read; `PATCH /api/v1/notifications/read-all` marks all as read.

New accounts receive the READER role. The role is server-owned and cannot be selected during public sign-up. Creator, moderator and admin access must be granted through a trusted administrative operation; no public role-escalation endpoint is provided.

## Creator Studio data

Creator stories, genres, chapters and comic panel URLs are saved in PostgreSQL and scoped to the signed-in author. Drafts can be opened from another device after signing in. The API validates story/chapter fields, validates HTTP(S) panel URLs, and checks that a story has a title, synopsis, genre and at least one complete chapter before submission.

Only DRAFT stories can be edited or submitted. Stories remain locked while awaiting review; when changes are requested, the story returns to DRAFT so its creator can revise and resubmit it. The Creator Studio Review history page preserves every moderator decision, reviewer and feedback note for the signed-in creator. The Analytics page reports signed-in accounts with saved reading progress, recent progress updates, library saves and followers; it does not label these account-based metrics as total page views. Published story detail pages display an average star rating and rating count; each signed-in reader may keep one 1–5 star rating per story, update it, or remove it. Creators cannot rate their own stories, and individual reader identities are not shown. The UI uses image URLs for comic panels and covers; file uploads and object storage are not part of this milestone.

Public creator pages are available at `/creators/:creatorId`; the route accepts either the legacy creator ID or the custom handle. Creator Studio includes profile settings for the public name, avatar URL, unique handle, 500-character bio and website URL. Public pages show these fields, the account join date, follower count and published stories only. Creator email addresses and unpublished work are not included.

The Prisma `User` model stores nullable creator profile fields so existing reader accounts remain valid. A fresh local database includes these fields when the initial migration is generated. Existing databases should apply pending committed migrations with `pnpm db:deploy` before deploying creator profile, follow, chapter comment, notification, or content-reporting features.

Creator follows, reader bookmarks, chapter progress and chapter comments are stored in PostgreSQL. Apply pending creator profile, CreatorFollow, ChapterComment, Notification, ContentReport, and content moderation action migrations with `pnpm db:deploy` before deploying these features. The public creator profile includes a live follower count and a follow/unfollow control for signed-in readers. The library API only exposes published stories, and progress writes only accept published chapters. The website sends progress updates as the reader scrolls; signing in on another device loads the same library and last-read chapter. Chapter comments are public to readers of published chapters; posting requires sign-in, and only the comment author can edit or delete their own comment. When a moderator approves a creator submission, followers receive an in-app notification in the same database transaction; no email or push delivery is configured.

The Admin Review workspace uses the database-backed moderation API. The separate Content Reports workspace lets moderators review reader reports about published stories and chapter comments. Reports preserve a snapshot of the reported content and the reporter’s reason for review. A moderator can resolve a report without removing content, dismiss it, unpublish a reported story, or remove a reported chapter comment. Story takedowns archive the story and unpublish its chapters; comment removals are soft-deletions that preserve the original text and the moderator who removed it for audit purposes.

## Website authentication and route protection

The Next.js app proxies `/api/auth/*` and `/api/v1/*` through external rewrites. Browser authentication uses the website origin for its session cookie. The Next.js server forwards that cookie to the API to validate access to protected pages.

- `/sign-up` and `/sign-in` provide email/password account screens.
- Creator Studio requires CREATOR, MODERATOR or ADMIN.
- The moderation workspace requires MODERATOR or ADMIN.
- Accounts without the required role are sent to `/access-denied`.

Set the API's `BETTER_AUTH_URL` and `WEB_ORIGIN` to the public website origin. Configure HTTPS and use an API origin reachable by the Next.js runtime when deploying. Email verification delivery is not configured yet; configure and require it before public production launch.

## Available scripts

```bash
pnpm dev:web        # Start the Next.js website
pnpm build:web      # Build the website
pnpm lint:web       # Run website ESLint
pnpm typecheck:web  # Check website TypeScript
pnpm dev:api        # Start the API in watch mode
pnpm build:api      # Generate Prisma Client and build the API
pnpm typecheck:api  # Generate Prisma Client and check API TypeScript
pnpm db:generate    # Generate Prisma Client
pnpm db:migrate     # Create/apply a development migration
pnpm db:deploy      # Apply committed migrations in deployment
pnpm db:studio      # Open Prisma Studio
```

## Project structure

```text
apps/
  api/
    prisma/         # PostgreSQL schema and migrations
    src/            # Express API and authentication
  web/
    app/            # Next.js routes and global styles
packages/           # Shared packages
docker-compose.yml  # Local PostgreSQL service
```
