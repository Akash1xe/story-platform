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

Create and apply the initial database migration:

```bash
pnpm --filter @story-platform/api db:migrate --name init
```

Start the API:

```bash
pnpm dev:api
```

The API listens on `http://localhost:4000`.

- `GET /api/v1/health` checks that the API process is running.
- `GET /api/v1/ready` checks that PostgreSQL is reachable.

The local database credentials are for development only. Never use them in a deployed environment.

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
    src/            # Express API
  web/
    app/            # Next.js routes and global styles
packages/           # Shared packages
docker-compose.yml  # Local PostgreSQL service
```

## Current backend scope

The API foundation includes Express 5, environment validation, security headers, CORS, health/readiness endpoints, Prisma 7 with the PostgreSQL driver adapter, and the initial relational schema for users, stories, chapters, comic panels, genres, library entries, reading progress, and moderation reviews.

Authentication, authorization enforcement, production migrations, media uploads, and story CRUD endpoints are intentionally separate follow-up milestones. The existing creator/admin browser prototype is not connected to this API yet.
