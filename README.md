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

Start the website:

```bash
pnpm dev:web
```

## Start the API and database

Start PostgreSQL with the development defaults:

```bash
docker compose up -d postgres
```

Copy the API environment template:

```bash
cp apps/api/.env.example apps/api/.env
```

Replace `BETTER_AUTH_SECRET` with a fresh secret (at least 32 characters). For example:

```bash
openssl rand -base64 32
```

Generate the Prisma client and apply the database migration:

```bash
pnpm --filter @story-platform/api db:generate
pnpm --filter @story-platform/api db:migrate --name add-authentication
```

Start the API:

```bash
pnpm dev:api
```

The API listens on `http://localhost:4000`.

## Authentication endpoints

Better Auth is mounted at `/api/auth/*`. It provides email/password sign-up, sign-in, sign-out, session and password-management endpoints. The API's CORS configuration allows the configured web origin to send credentialed requests.

- `GET /api/v1/health` checks that the API process is running.
- `GET /api/v1/ready` checks that PostgreSQL is reachable.
- `GET /api/v1/me` returns the signed-in user and current session.
- `GET /api/v1/creator/stories` requires the CREATOR, MODERATOR or ADMIN role.
- `GET /api/v1/moderation/reviews` requires the MODERATOR or ADMIN role.

New accounts receive the READER role. The role is a server-owned field and is not accepted from sign-up requests. Creator, moderator and admin access must be granted through trusted administrative operations; no public role-escalation endpoint is provided.

Email/password sign-in is enabled. Email verification delivery is not configured in this milestone, so email verification is not yet enforced. Configure an email provider and enable verification before public production launch.

## Website authentication

Copy `apps/web/.env.example` to `apps/web/.env.local` and set `API_SERVER_URL` to the backend origin reachable by the Next.js server. In local development this is `http://localhost:4000`.

The Next.js app proxies `/api/auth/*` and `/api/v1/*` through external rewrites. Browser authentication therefore uses the website origin for its session cookie, while the Next.js server forwards that cookie to the API when validating protected pages. For deployment, configure HTTPS and make sure the Next.js runtime can reach the configured API origin. Set the API's `BETTER_AUTH_URL` and `WEB_ORIGIN` to the public website origin.

The website provides:
- `/sign-up` and `/sign-in` for email/password accounts.
- A reactive account control in the site header for the current account and sign-out.
- Server-validated access to Creator Studio for CREATOR, MODERATOR and ADMIN roles.
- Server-validated access to the moderation queue for MODERATOR and ADMIN roles.

Sign-up creates a READER account. A trusted administrator must grant creator or moderator roles before those workspaces become available. The existing creator drafts and review queue still use local browser storage; the pages are protected, but story CRUD and moderation decisions are not yet connected to the database.

Email verification delivery is not configured yet. Configure an email provider and require verification before allowing public production accounts to publish or moderate content.

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

## Current backend scope

The API includes Express 5, Better Auth, Prisma 7 with the PostgreSQL driver adapter, role-aware API middleware, security headers, CORS, health/readiness endpoints, and relational models for users, sessions, linked accounts, verification tokens, stories, chapters, comic panels, genres, library entries, reading progress, and moderation reviews.

The local Creator Studio and Admin Review interfaces are protected by role checks, but their drafts and decisions still use browser storage. Story CRUD, server-side moderation decisions, media uploads and syncing creator work across accounts are follow-up work.
