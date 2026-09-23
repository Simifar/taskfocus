<div align="center">
  <img src="public/logo.svg" alt="TaskFocus logo" width="76" height="76" />
  <h1>TaskFocus</h1>
  <p><strong>A calmer way to plan the work in front of you.</strong></p>
  <p>A personal task planner built around a small daily focus, flexible dates, and room to think.</p>
  <p>
    <a href="README.ru.md">Читать на русском</a> ·
    <a href="#features">Features</a> ·
    <a href="#get-started">Get started</a> ·
    <a href="docs/ARCHITECTURE.md">Architecture</a>
  </p>
  <p>
    <img src="https://img.shields.io/badge/Node.js-%E2%89%A520.9-43853D?logo=node.js&logoColor=white" alt="Node.js 20.9 or newer" />
    <img src="https://img.shields.io/badge/license-MIT-2f855a.svg" alt="MIT License" />
    <img src="https://img.shields.io/badge/interface-Russian-6b7280.svg" alt="Russian-language interface" />
  </p>
</div>

---

## A little less pressure. A clearer next step.

TaskFocus is a full-stack task planner for people who would rather make a manageable plan than stare at an endless list. Capture things before they slip away, choose a realistic focus for today, and keep flexible deadlines flexible.

The application interface is currently in Russian. There is no hosted demo link: run your own local instance to explore it.

## A look inside

The screenshots below are real captures of the current sign-in and registration screens. Dashboard screenshots are omitted because no safe demo environment is currently available.

<p align="center">
  <img src="docs/images/sign-in.png" alt="TaskFocus sign-in page on desktop" width="100%" />
</p>
<p align="center"><sub>Sign in · desktop</sub></p>

<p align="center">
  <img src="docs/images/sign-up-mobile.png" alt="TaskFocus registration page on a mobile screen" width="340" />
</p>
<p align="center"><sub>Create an account · mobile</sub></p>

## Features

- **Inbox capture** — add an unscheduled task without deciding everything about it first.
- **A smaller daily plan** — Today recommends a next task and limits the plan to five active tasks scheduled for the day.
- **Flexible dates** — use a date or a soft start/end range instead of treating every deadline as a hard promise.
- **Several ways to plan** — move between Today, Inbox, week, calendar, day, Eisenhower matrix, and archive views.
- **Tasks with useful context** — add one level of subtasks, importance, urgency, and an energy estimate from 1 to 5.
- **A considered finish** — complete, archive, restore, or delete tasks; review activity in your profile and statistics.
- **A local focus timer** — use a 25-minute focus session without a separate timer service.

TaskFocus is a planning tool, not a medical product or a promise of increased productivity.

## Built with

| Area | Tools |
| --- | --- |
| Application | Next.js App Router, React, TypeScript |
| Interface | Tailwind CSS, Radix UI, shadcn/ui, lucide-react |
| Client state | TanStack Query, Zustand |
| Server and data | Next.js Route Handlers, Prisma, PostgreSQL / Neon |
| Authentication | NextAuth credentials; optional Google OAuth |

## How it fits together

```mermaid
flowchart LR
    U[Browser interface] --> A[Next.js App Router]
    A --> R[Route Handlers]
    R --> S[Session and ownership checks]
    S --> P[Prisma]
    P --> D[(PostgreSQL / Neon)]
```

The interactive dashboard reads and changes server data through authenticated API routes. The server scopes task operations to the signed-in user before Prisma accesses PostgreSQL. See [the architecture notes](docs/ARCHITECTURE.md) for module and data-flow details.

## Get started

### Requirements

- Node.js `20.9` or newer and npm.
- A PostgreSQL database you can use for local development. A disposable local database is recommended.
- Google OAuth credentials only if you want to enable Google sign-in locally.

### Install and run

```bash
npm ci
```

Copy `.env.example` to `.env` (PowerShell: `Copy-Item .env.example .env`) and set `DATABASE_URL`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL`. Keep `.env` private; it is intentionally ignored by Git.

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/taskfocus?schema=public"
NEXTAUTH_SECRET="replace-with-a-long-random-secret"
NEXTAUTH_URL="http://localhost:3000"
```

Then prepare the local database and start the app:

```bash
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). For step-by-step setup, Google OAuth, and troubleshooting, see [`docs/SETUP.md`](docs/SETUP.md).

> **Local database only:** `db:push` synchronizes the schema, and `db:seed` creates the demo account and replaces that account's tasks. Never point either command at production or a database containing data you need to keep.

The seed login is `demo@taskfocus.app` / `demo1234`. It is only for a local disposable database; do not reuse this password anywhere else.

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run check` | Run ESLint, TypeScript checks, and existing unit/domain tests |
| `npm run build` | Generate Prisma Client and build for production |
| `npm run start` | Run the production build locally |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:push` | Sync schema to the configured database — local development only |
| `npm run db:seed` | Load local demo data — destructive to the demo user's tasks |

There is no automated authenticated browser/E2E suite yet. The current unit and domain coverage is described in [the architecture notes](docs/ARCHITECTURE.md).

## Security, privacy, and scope

Task data is stored in the PostgreSQL database configured by the operator; this is not an offline-only application. Do not commit credentials or real user data. The optional seed account is for disposable local development only.

Email/password sign-in is available. Google sign-in appears only when its OAuth credentials are configured. Password recovery pages are informational placeholders: password reset and email delivery are not implemented. The interface is Russian-only, and shared workspaces/team features are not part of the current application.

See [`SECURITY.md`](SECURITY.md) for vulnerability reporting and [`SUPPORT.md`](SUPPORT.md) for project support routes.

## Documentation

- [Local setup and environment variables](docs/SETUP.md)
- [Architecture and current limitations](docs/ARCHITECTURE.md)
- [Dependencies and security baseline](docs/DEPENDENCIES.md)
- [Database migration design (proposal, not applied)](docs/PHASE4-MIGRATION-DESIGN.md)
- [Release notes drafts and publication status](docs/RELEASES.md)
- [Academic project context](docs/THESIS.md)
- [Contribution guide](CONTRIBUTING.md)

## Contributing

Small, focused contributions are welcome. Start with [`CONTRIBUTING.md`](CONTRIBUTING.md), review open issues before starting a large change, and use the pull-request template. Please don't include secrets or private user data in an issue or pull request.

## License

TaskFocus is available under the [MIT License](LICENSE).
