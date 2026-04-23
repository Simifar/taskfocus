# TaskFocus Architecture

Living document. Keep it aligned with the actual codebase.

## Goals

- ADHD-oriented task manager with energy levels `1-5`
- soft deadlines as date ranges instead of a single hard due date
- at most `5` active tasks planned for one day
- simple deployment on `Vercel + Neon`
- codebase that is small enough for a single diploma project author to maintain

## Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16 App Router | Full-stack app, Vercel-native |
| UI | React 19 + Tailwind v4 + shadcn/ui | Client-heavy dashboard with reusable primitives |
| Server state | TanStack Query | Tasks, stats, current user |
| UI state | Zustand | Dashboard view and filters |
| Database | PostgreSQL on Neon | Serverless Postgres for Vercel deployment |
| ORM | Prisma | Typed schema and DB access |
| Auth | Hybrid auth | Custom JWT for email/password + NextAuth Google OAuth |

## Runtime model

- `src/app` contains routing and route handlers
- `src/features/*` contains feature UI, hooks, and client API calls
- `src/server/*` contains server-only helpers for auth, db, api responses, and rate limiting
- `src/proxy.ts` protects app entry points that require authentication

## Current route surface

- `/` - auth page or dashboard, depending on session state
- `/profile` - authenticated profile page
- `/api/auth/*` - email/password auth, profile actions, NextAuth Google OAuth
- `/api/tasks*` - task CRUD and reorder
- `/api/subtasks` - subtask creation
- `/api/stats` - dashboard statistics

## Auth architecture

TaskFocus currently supports two auth paths:

1. Email/password
   - password is hashed with bcrypt
   - app issues its own JWT signed with `JWT_SECRET`
   - JWT is stored in `auth-token` httpOnly cookie

2. Google OAuth
   - powered by `next-auth`
   - session strategy is JWT
   - Google credentials are stored in `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
   - session secret is `NEXTAUTH_SECRET`

`getCurrentUser()` in `src/server/auth.ts` first checks the NextAuth session, then falls back to the custom JWT cookie.

## Data model

Current Prisma models:

- `User`
- `Account`
- `VerificationToken`
- `Task`

Important task fields:

- `status`: `active | completed | archived`
- `priority`: `low | medium | high`
- `energyLevel`: `1..5`
- `dueDateStart`, `dueDateEnd`
- `parentTaskId` for subtasks
- `position` for manual ordering

## Deployment architecture

Production target:

- frontend and server routes on Vercel
- PostgreSQL on Neon

Important environment variables:

- `DATABASE_URL`
- `JWT_SECRET`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

Important deployment notes:

- `NEXTAUTH_URL` must match the deployed domain
- Google OAuth callback URIs must include both local and production URLs
- Prisma client is created as a singleton in `src/server/db.ts`
- Neon-specific connection parameters are appended in `src/server/db.ts`

## Response and state conventions

- route handlers return a common envelope: `{ success, data, error }`
- protected handlers use `withAuth(...)`
- auth endpoints can use `withRateLimit(...)`
- client fetches go through `apiFetch(...)`

## Known infrastructure decisions

- `proxy.ts` is used instead of deprecated `middleware.ts` because the app is on Next.js 16
- Prisma CLI config is stored in `prisma.config.ts`
- seeding runs through `tsx prisma/seed.ts` instead of Bun so local setup stays aligned with `npm`

## Current technical debt

- some client forms still fail ESLint because of `setState` inside effects
- logout/delete-account flow still needs a full pass for mixed custom auth + NextAuth session cleanup
- documentation outside this file should be treated as stale unless recently updated
