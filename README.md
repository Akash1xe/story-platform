# Story Platform

A creator-driven storytelling platform for comics, novels, and short stories.

The repository uses a pnpm workspace. The first application is the Next.js website in \`apps/web\`.

## Requirements

- Node.js 20.9 or newer
- pnpm 10 or newer

## Getting started

From the repository root:

\`\`\`bash
pnpm install
pnpm dev:web
\`\`\`

Open [http://localhost:3000](http://localhost:3000).

## Available scripts

\`\`\`bash
pnpm dev:web       # Start the website in development mode
pnpm build:web     # Create a production build
pnpm lint:web      # Run ESLint
pnpm typecheck:web # Run TypeScript checks
\`\`\`

## Project structure

\`\`\`text
apps/
  web/
    app/            # Next.js routes and global styles
packages/           # Future shared packages
\`\`\`

## Development status

This first milestone establishes the web application foundation. The homepage, reader experiences, API, database, authentication, creator publishing, and moderation tools will be added in subsequent pull requests.
