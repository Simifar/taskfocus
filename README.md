# TaskFocus

Task manager designed for ADHD users: energy-based prioritisation (1–5), soft deadlines (date ranges), and a hard cap of 5 active tasks per day to avoid overload.

Built with Next.js 16, TypeScript, Prisma, PostgreSQL, TanStack Query and shadcn/ui.

## Getting started

```bash
bun install
cp .env.example .env        # fill in DATABASE_URL and JWT_SECRET
bun run db:migrate          # apply migrations
bun run db:seed              # (optional) seed demo data
bun run dev
```

Open http://localhost:3000.

## Environment

| Variable      | Example                                                      |
|---------------|--------------------------------------------------------------|
| `DATABASE_URL`| `postgresql://user:pass@host/db?sslmode=require`             |
| `JWT_SECRET`  | Any 32+ char random string                                   |

For production, use Neon (recommended) or Vercel Postgres — both are serverless Postgres and integrate with Vercel in one click.

## Scripts

| Script              | Description                          |
|---------------------|--------------------------------------|
| `bun run dev`       | Next.js dev server on port 3000      |
| `bun run build`     | Production build                     |
| `bun run start`     | Serve the build                      |
| `bun run lint`      | ESLint                               |
| `bun run db:generate`| Prisma client                       |
| `bun run db:migrate`| Apply migrations (dev)               |
| `bun run db:push`   | Push schema without a migration      |
| `bun run db:seed`   | Seed demo data                       |
| `bun run db:reset`  | Drop & recreate the schema           |

## Documentation

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the system design.

## License

Diploma thesis project.
