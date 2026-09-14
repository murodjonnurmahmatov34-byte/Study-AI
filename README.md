# StudyAI — AI Study Assistant

Full-stack Next.js 16 + PostgreSQL (Drizzle ORM) study platform: upload notes → AI summary → quizzes → flashcards → grounded Q&A chat → progress analytics.

## Quick start
```bash
cp .env.example .env         # fill in DATABASE_URL and (optionally) AI / Google keys
npm install
npm run db:push              # apply schema (or `npm run db:migrate` to use drizzle/ migrations)
npm run db:seed              # demo account: demo@studyai.app / demo1234
npm run dev
```

## AI provider
Set `AI_PROVIDER` (`openai` | `anthropic` | `openai-compatible`), `AI_API_KEY`, `AI_MODEL`, and optionally `AI_BASE_URL`.
Without a key the app uses a local extractive engine so every feature still works end-to-end.

## Structure
- `src/app/(auth)` — login / register / forgot & reset password
- `src/app/(dashboard)` — protected app pages (dashboard, notes, subjects, chat, quiz, flashcards, progress, settings)
- `src/app/api` — route handlers (auth, notes, upload, quiz, flashcards, chat, settings)
- `src/lib` — `auth.ts`, `ai.ts`, `progress.ts`, `files.ts`, `validation.ts`, `utils.ts`
- `src/db/schema.ts` — Drizzle schema; `drizzle/` — generated SQL migrations; `scripts/seed.ts` — seed data
