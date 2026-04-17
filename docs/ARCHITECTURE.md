# TaskFocus Architecture

Living document. Update whenever a significant decision changes.

## Goals

- Task manager tuned for ADHD users (energy levels 1-5, soft deadlines as date ranges, "max 5 active" constraint).
- Simple to deploy on Vercel.
- Small, typed codebase that a single developer can maintain.

## Tech stack

| Layer        | Choice                         | Why                                                 |
|--------------|--------------------------------|-----------------------------------------------------|
| Framework    | Next.js 16 (App Router)        | Full-stack, Vercel-native                           |
| Language     | TypeScript (strict)            | Type safety end-to-end                              |
| UI           | React 19 + Tailwind v4 + shadcn/ui | Modern, minimal custom CSS                      |
| Data fetching| TanStack Query                 | Cache, stale-while-revalidate, no manual reducers   |
| UI state     | Zustand (persist)              | Tiny store for filters / current view               |
| Forms        | react-hook-form + zod          | Validation shared with API                          |
| Database     | PostgreSQL (Neon in prod)      | Serverless-friendly, free tier, Vercel integration  |
| ORM          | Prisma                         | Typed schema, migrations                            |
| Auth         | Custom JWT in httpOnly cookie  | No third-party, fits thesis scope                   |

## Directory layout

```
src/
├── app/                    # Next.js routing only
│   ├── (auth)/             # login, register
│   ├── (app)/              # authenticated area, shared layout
│   │   ├── dashboard/
│   │   └── profile/
│   ├── api/                # route handlers (thin, delegate to features/server)
│   ├── layout.tsx          # root layout + providers
│   └── globals.css
│
├── features/               # each feature owns its slice end-to-end
│   ├── auth/
│   │   ├── components/     # AuthPage, LoginForm, RegisterForm
│   │   ├── hooks/          # useCurrentUser, useLogin, useRegister
│   │   ├── api.ts          # client fetch functions
│   │   └── schemas.ts      # zod schemas, shared with API
│   ├── tasks/
│   │   ├── components/     # TaskCard, TaskList, dialogs
│   │   ├── hooks/          # useTasks, useCreateTask, useReorderTasks
│   │   ├── api.ts
│   │   ├── schemas.ts
│   │   └── utils.ts        # date/energy filter helpers
│   ├── categories/
│   ├── dashboard/
│   │   ├── layout/         # sidebar, page chrome
│   │   ├── views/          # today, inbox, week, calendar, day
│   │   ├── hooks/          # useDashboardState (UI state only)
│   │   └── shared/         # energy-status, etc.
│   ├── profile/
│   └── stats/
│
├── shared/
│   ├── ui/                 # shadcn components (only the ones we use)
│   ├── lib/                # cn, date helpers, ApiResponse type
│   ├── hooks/
│   └── types/
│
└── server/                 # server-only modules
    ├── db.ts               # Prisma client singleton
    ├── auth.ts             # JWT, cookies, getCurrentUser
    ├── rate-limit.ts
    ├── api.ts              # ok(), err(), withAuth(), withRateLimit()
    └── validation.ts       # shared zod helpers
```

## Data flow

1. **Server state** (tasks, categories, stats, user) → TanStack Query.
2. **UI state** (current view, energy filter, search, sort) → Zustand with `persist`.
3. **Forms** → react-hook-form + zod schemas from `features/*/schemas.ts`.
4. **API response envelope**: `{ success, data, error }`. All route handlers use `ok()` / `err()` from `server/api.ts`.

## Auth

- Password hashed with bcrypt (cost 12).
- JWT signed with `JWT_SECRET` (HS256, 7 days), stored in httpOnly `auth-token` cookie.
- `middleware.ts` guards the `(app)` segment — unauthenticated users redirect to `/login`.
- Every protected route handler uses `withAuth(handler)`; rate-limited auth endpoints use `withRateLimit`.

## Database model

- **User** — id, email, username, passwordHash, name, avatar.
- **Category** — id, userId, name, color, icon. Unique per (userId, name).
- **Task** — id, userId, categoryId?, title, description?, status, priority, energyLevel, position, dueDateStart?, dueDateEnd?, parentTaskId? (self-relation for subtasks), timestamps.
- Hard deletes for Category set `Task.categoryId = null` (onDelete: SetNull).
- Deleting a parent Task cascades to subtasks.

## Conventions

- No `console.log` outside `console.error` in error branches.
- No test data in runtime code — use `prisma/seed.ts`.
- Route handlers stay thin: parse → delegate → respond. Business logic lives in `features/*/server.ts` when it grows.
- No barrel `index.ts` files; import from exact paths.
- Keep comments out unless the *why* is non-obvious.
