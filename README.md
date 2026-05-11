# YourBOSS

AI-powered study companion for Thai medical students preparing for the **National License Examination Step 1 (NLE1)**.

Upload a lecture PDF → get a summary, an outline, 30 MCQs, 50 flashcards, and a tutor chat that cites the slide. Review flashcards on an FSRS schedule. Track your weakest NLE1 topics on a 20-tile coverage map.

## Stack

- **Next.js 15** (App Router) + **TypeScript** + **Tailwind** + shadcn-style UI primitives
- **Supabase** for Postgres, Auth (email magic-link), and Storage
- **Drizzle ORM** for typed queries + migrations
- **react-pdf** for the in-app PDF viewer
- **Zustand** (UI state) + **TanStack Query** (server state)
- **ts-fsrs** for spaced-repetition scheduling
- **@google/genai** with `gemini-3-flash-preview` (structured output, streaming, `thinking_level: "high"`)

## Quick start

```bash
pnpm install     # or npm install / yarn

cp .env.example .env.local
# fill in the env vars (see below)

pnpm db:push     # apply Drizzle schema to your Supabase Postgres
pnpm db:seed     # create demo user + sample course/deck
pnpm dev
```

Open <http://localhost:3000>. Sign in with `demo@yourboss.app` (password `yourboss-demo`) — or use email magic-link as a new user.

## Environment variables

Copy `.env.example` to `.env.local` and set:

| Variable | Where to get it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project settings → API (server-only) |
| `DATABASE_URL` | Supabase project → Database → Connection string (pooler) |
| `GOOGLE_GENAI_API_KEY` | <https://aistudio.google.com/apikey> |
| `GEMINI_MODEL` | Defaults to `gemini-3-flash-preview` |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` in dev |

### Supabase setup

1. Create a new Supabase project.
2. In **Authentication → Providers**, enable **Email** with magic-link.
3. In **Authentication → URL Configuration**, add `http://localhost:3000/auth/callback` and your production callback URL.
4. In **Storage**, create a private bucket called **`decks`**.
5. Copy keys into `.env.local`.
6. Run `pnpm db:push` to create tables.

## Routes

| Route | Description |
| --- | --- |
| `/` | Landing. Signed-in users are redirected to `/today`. |
| `/login` | Magic-link sign-in. |
| `/today` | Dashboard: due cards, recent decks, suggested next session. |
| `/courses` | Course list + create-course dialog. |
| `/courses/[id]` | Drag-and-drop a PDF onto the course. Lists decks with status. |
| `/decks/[id]` | Two-pane workspace: PDF viewer + Chat / Questions / Flashcards / Notes. |
| `/decks/[id]/quiz` | Full-screen quiz: tutor, timed (30 Qs / 45 min), practice. |
| `/decks/[id]/flashcards` | Full-screen FSRS review (swipe on mobile). |
| `/dashboard/nle1` | 20-tile NLE1 coverage map (G1–G9, S1–S11). |
| `/dashboard/nle1/[code]` | Drill-down: coverage, accuracy, decks, next action. |
| `/settings` | Profile, API key, language (en/th), theme. |

`Cmd+K` / `Ctrl+K` opens the command palette anywhere.

## Data model

All in `src/db/schema.ts` (Drizzle). Entities: `users`, `courses`, `decks`, `slides`, `questions`, `question_attempts`, `flashcards`, `flashcard_reviews`, `chat_threads`, `chat_messages`, `highlights`, `topic_coverage`.

Run `pnpm db:generate` to produce a SQL migration after schema changes.

## LLM call pattern

All Gemini calls go through `lib/ai/gemini.ts`:

```ts
import { generate, streamChat } from "@/lib/ai/gemini";

const result = await generate<MyShape>({
  task: "deck-process",
  input: { kind: "pdf", bytes, prompt },
  schema: mySchema,
  thinkingLevel: "high",
});
```

- A shared **system instruction** enforces `[Slide N]` citations, no fabricated content, and the user's preferred language.
- Generation tasks use **structured output** (response schemas). Chat **streams**.
- Per-user API keys (stored in `users.gemini_api_key`) override the server key.

The deck processing schema (`lib/ai/schemas.ts`) requests: summary, outline, NLE1 topic tags, high-yield concepts, 30 MCQs, and 50 flashcards.

## PWA / offline

- `public/manifest.webmanifest` for installability.
- `public/sw.js` caches the shell and recently-viewed deck PDFs so flashcards and the last opened deck work offline.
- Service worker registers only in production builds (`SwRegister`).

## Deploy

- **Vercel**: import the repo. Set the env vars above. The build command is `next build`.
- **Supabase**: this app does **not** require any Postgres function or trigger — just the schema and a `decks` storage bucket. RLS is not used (server routes verify ownership via `userId`).

## What's intentionally not built (yet)

Audio overviews, image overlays, cross-deck library articles, study group sharing, and the calendar planner are Phase 2.
