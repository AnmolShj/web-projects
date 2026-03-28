# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Initial setup (install deps, generate Prisma client, run migrations)
npm run setup

# Development server (port 3000)
npm run dev

# Build for production
npm run build

# Run all tests
npm test

# Run a single test file
npx vitest run src/components/chat/__tests__/ChatInterface.test.tsx

# Lint
npm run lint

# Reset database
npm run db:reset
```

The dev server requires `NODE_OPTIONS='--require ./node-compat.cjs'` — this is already handled in the npm script. The `ANTHROPIC_API_KEY` in `.env` is optional; a mock model is used as a fallback.

## Architecture

UIGen is a three-panel AI-powered React component generator: **Chat** (left) | **Code editor + Live preview** (right). Users describe components, Claude AI generates code, and a live preview renders instantly.

### Request Flow

1. User sends a message → `ChatProvider` (`src/lib/contexts/chat-context.tsx`) calls `/api/chat`
2. `/api/chat/route.ts` uses Vercel AI SDK `streamText` with Claude (or mock) and two tools:
   - `str_replace_editor` (`src/lib/tools/str-replace.ts`) — create/edit files
   - `file_manager` (`src/lib/tools/file-manager.ts`) — manage file operations
3. Tool calls update the virtual file system via `FileSystemProvider` (`src/lib/contexts/file-system-context.tsx`)
4. `PreviewFrame` (`src/components/preview/PreviewFrame.tsx`) transpiles JSX in-browser via Babel standalone and renders in an iframe

### Virtual File System

All files exist only in memory — nothing is written to disk during generation. The file tree is serialized as JSON into the `Project.data` column in SQLite. Key class: `src/lib/file-system.ts`.

### Authentication

JWT-based with HTTP-only secure cookies via `jose`. Anonymous users are supported with localStorage tracking (`src/lib/anon-work-tracker.ts`). Server actions for auth live in `src/actions/index.ts`. Middleware at `src/middleware.ts` protects routes.

### Database

Prisma with SQLite. Two models: `User` (email + hashed password) and `Project` (name, optional userId, messages as JSON, file system data as JSON). Schema at `prisma/schema.prisma`.

### Key Conventions

- Path alias `@/*` maps to `src/*`
- Tailwind CSS v4 (no `tailwind.config.js` — configured via CSS)
- shadcn/ui components in `src/components/ui/` (style: "new-york")
- Tests use Vitest + React Testing Library, co-located in `__tests__/` directories
- The AI system prompt is in `src/lib/prompts/generation.tsx`
- Model provider initialization in `src/lib/provider.ts` — swap model here
