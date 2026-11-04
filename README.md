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

Generate the Prisma client and create the initial migration for a fresh local database:

```bash
pnpm --filter @story-platform/api db:generate
pnpm --filter @story-platform/api db:migrate --name init
```

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
- `PUT /api/v1/creator/stories/:storyId` saves a draft and replaces its ordered chapter/panel content.
- `POST /api/v1/creator/stories/:storyId/submit` validates and submits a draft for moderation.
- `GET /api/v1/moderation/reviews?filter=Pending|Reviewed|All` lists the moderator queue and review history.
- `POST /api/v1/moderation/reviews/:storyId/decision` records an approval or change request.

New accounts receive the READER role. The role is server-owned and cannot be selected during public sign-up. Creator, moderator and admin access must be granted through a trusted administrative operation; no public role-escalation endpoint is provided.

## Creator Studio data

Creator stories, genres, chapters and comic panel URLs are saved in PostgreSQL and scoped to the signed-in author. Drafts can be opened from another device after signing in. The API validates story/chapter fields, validates HTTP(S) panel URLs, and checks that a story has a title, synopsis, genre and at least one complete chapter before submission.

Only DRAFT stories can be edited or submitted. A moderator can approve a submission, which marks the story and its chapters as published, or request changes, which returns it to DRAFT with a persisted review note. Only MODERATOR and ADMIN accounts can review submissions. The UI uses image URLs for comic panels and covers; file uploads and object storage are not part of this milestone.

The Admin Review screen reads submissions and review history from PostgreSQL. Decisions are persisted with the moderator and timestamp.


## Public discovery and reading

- `GET /api/v1/stories` lists published stories with search, genre, format, publication status, sorting and pagination filters.
- `GET /api/v1/stories/:slug` returns a published story and its published chapter list.
- `GET /api/v1/stories/:slug/chapters/:chapterNumber` returns the selected published chapter, including prose content or ordered comic panel image URLs.

Public endpoints only return stories with `PUBLISHED` status and at least one published chapter. The Discover catalog, story detail pages and chapter reader use these endpoints; draft and in-review content is not exposed publicly.

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
