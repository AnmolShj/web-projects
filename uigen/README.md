# UIGen

> AI-powered React component generator with real-time live preview

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38BDF8?style=flat-square&logo=tailwindcss)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)
![Claude AI](https://img.shields.io/badge/Claude-AI-orange?style=flat-square)

---

## Overview

UIGen is a three-panel web application that lets you describe a React component in plain English and instantly see the generated code alongside a live rendered preview. It uses Anthropic's Claude AI as its generation engine and runs entirely in the browser — no files are ever written to disk.

```
┌──────────────┬─────────────────────┬──────────────────────┐
│     Chat     │    Code Editor      │    Live Preview      │
│              │                     │                      │
│  Describe    │  Generated JSX/TSX  │  Rendered component  │
│  components  │  with syntax        │  in real-time        │
│  in natural  │  highlighting       │  using in-browser    │
│  language    │                     │  Babel transpilation │
└──────────────┴─────────────────────┴──────────────────────┘
```

---

## Features

- **AI code generation** — Describe components in plain English; Claude generates clean, production-ready React code
- **Live preview** — In-browser Babel transpilation renders components instantly without a build step
- **Virtual file system** — All generated files exist only in memory; nothing touches the disk
- **Code editor** — Syntax-highlighted editor with a file tree for multi-file projects
- **Authentication** — JWT-based auth with HTTP-only cookies; anonymous sessions supported
- **Project persistence** — Registered users can save and reload previous projects
- **Streaming responses** — AI responses stream token-by-token via Vercel AI SDK
- **Mock fallback** — Runs without an API key using a static mock model

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| UI | React 19, Tailwind CSS v4, shadcn/ui |
| AI | Anthropic Claude, Vercel AI SDK |
| Database | SQLite via Prisma ORM |
| Auth | JWT (`jose`), HTTP-only cookies |
| Testing | Vitest, React Testing Library |
| Transpilation | Babel standalone (in-browser) |

---

## Prerequisites

- **Node.js** 18 or higher
- **npm**
- **Anthropic API key** _(optional — a mock model is used as fallback)_

---

## Setup

### 1. Configure environment (optional)

Create a `.env` file in this directory:

```env
ANTHROPIC_API_KEY=your-api-key-here
```

If omitted, the app runs in mock mode and returns static example components instead of AI-generated ones.

### 2. Install and initialise

```bash
npm run setup
```

This single command:
- Installs all npm dependencies
- Generates the Prisma client
- Runs all database migrations

### 3. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Usage

1. **Sign up** or click **Continue as guest** to start anonymously
2. Type a description in the chat panel — e.g. _"Create a responsive pricing card with a highlighted popular tier"_
3. Watch the code generate in real-time in the editor panel
4. See the live rendered output instantly in the preview panel
5. Iterate — send follow-up messages to refine the component
6. Switch between **Preview** and **Code** tabs to inspect or edit the output

---

## Architecture

### Request Flow

```
User message
    └─> ChatProvider (chat-context.tsx)
            └─> POST /api/chat
                    └─> Vercel AI SDK streamText (Claude or mock)
                            ├─> str_replace_editor tool  ─> FileSystemProvider
                            └─> file_manager tool        ─> FileSystemProvider
                                                                └─> PreviewFrame (re-renders)
```

### Key Modules

| Path | Responsibility |
|------|---------------|
| `src/app/api/chat/route.ts` | API route — streams AI responses, handles tool calls |
| `src/lib/contexts/chat-context.tsx` | Client-side chat state and message streaming |
| `src/lib/contexts/file-system-context.tsx` | In-memory virtual file system |
| `src/lib/file-system.ts` | Core VFS class (create, read, update, delete files) |
| `src/lib/tools/str-replace.ts` | `str_replace_editor` tool — targeted file edits |
| `src/lib/tools/file-manager.ts` | `file_manager` tool — bulk file operations |
| `src/components/preview/PreviewFrame.tsx` | In-browser Babel transpilation + iframe rendering |
| `src/lib/prompts/generation.tsx` | System prompt sent to Claude |
| `src/lib/provider.ts` | AI model initialisation (swap model here) |
| `src/middleware.ts` | Route protection, JWT validation |

### Virtual File System

All generated files live in memory as a JSON object. For authenticated users this JSON is serialised into the `Project.data` column in SQLite via Prisma. Nothing is ever written to disk during code generation.

### Authentication

JWT tokens are signed with `jose` and stored in HTTP-only, secure, `SameSite=Strict` cookies. Anonymous users are tracked via `localStorage` (`src/lib/anon-work-tracker.ts`). Server actions for sign-up, sign-in, and sign-out live in `src/actions/index.ts`.

---

## Available Scripts

```bash
npm run setup      # Install deps, generate Prisma client, run migrations
npm run dev        # Start development server (http://localhost:3000)
npm run build      # Production build
npm run lint       # ESLint
npm test           # Run all tests (Vitest)
npm run db:reset   # Drop and re-create the database
```

Run a single test file:

```bash
npx vitest run src/components/chat/__tests__/ChatInterface.test.tsx
```

---

## Project Structure

```
uigen/
├── prisma/
│   ├── schema.prisma          # Database schema (User, Project)
│   └── migrations/            # SQL migration history
├── src/
│   ├── actions/               # Next.js server actions (auth, projects)
│   ├── app/
│   │   ├── api/chat/          # Streaming AI API route
│   │   └── [projectId]/       # Dynamic project page
│   ├── components/
│   │   ├── auth/              # Sign-in / sign-up dialogs
│   │   ├── chat/              # Chat panel components
│   │   ├── editor/            # Code editor + file tree
│   │   ├── preview/           # Live preview iframe
│   │   └── ui/                # shadcn/ui primitives
│   ├── hooks/                 # Custom React hooks
│   └── lib/
│       ├── contexts/          # React context providers
│       ├── prompts/           # AI system prompt
│       ├── tools/             # AI tool implementations
│       ├── transform/         # JSX transformer utilities
│       ├── auth.ts            # JWT helpers
│       ├── file-system.ts     # Virtual file system core
│       └── provider.ts        # AI model provider
├── .env                       # API keys (not committed)
├── components.json            # shadcn/ui config
├── next.config.ts
├── package.json
├── tsconfig.json
└── vitest.config.mts
```

---

## Database Schema

```prisma
model User {
  id        String    @id @default(cuid())
  email     String    @unique
  password  String
  projects  Project[]
  createdAt DateTime  @default(now())
}

model Project {
  id        String   @id @default(cuid())
  name      String
  userId    String?
  user      User?    @relation(fields: [userId], references: [id])
  messages  Json     @default("[]")
  data      Json     @default("{}")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | _(none)_ | Anthropic API key. Falls back to mock model if unset. |

To swap the Claude model, edit `src/lib/provider.ts`.

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes with a descriptive message
4. Push and open a pull request

---

## License

MIT
