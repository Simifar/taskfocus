# TaskFocus

Task manager for ADHD-oriented planning: energy-based prioritization (`1-5`), soft deadlines as date ranges, subtasks, and a limit of `5` active tasks per day.

Built with Next.js 16, React 19, TypeScript, Prisma, PostgreSQL/Neon, TanStack Query, Zustand, and shadcn/ui.

## Local setup

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm run dev
```

Open `http://localhost:3000`.

## Required environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL / Neon connection string |
| `JWT_SECRET` | Secret for custom email/password auth cookie |
| `NEXTAUTH_SECRET` | Secret for NextAuth / Google OAuth sessions |
| `NEXTAUTH_URL` | App base URL, locally `http://localhost:3000` |
| `GOOGLE_CLIENT_ID` | Google OAuth client id |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |

## Google OAuth setup

Create an OAuth Client ID in Google Cloud Console and add these redirect URIs:

- Local: `http://localhost:3000/api/auth/callback/google`
- Production: `https://YOUR_DOMAIN/api/auth/callback/google`

For local development:

- set `NEXTAUTH_URL=http://localhost:3000`
- use the local redirect URI above

For Vercel production:

- set `NEXTAUTH_URL=https://YOUR_DOMAIN`
- add the production redirect URI in Google Cloud Console
- make sure the same domain is used in Vercel and Google OAuth settings

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start local dev server |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run lint` | ESLint |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Run Prisma dev migrations |
| `npm run db:reset` | Reset database |
| `npm run db:seed` | Seed demo data |

## Deployment notes

- Production target: `Vercel + Neon`
- Prisma datasource uses PostgreSQL
- `NEXTAUTH_URL` must match the real deployed domain
- if Google login fails after account selection, first check redirect URIs and `NEXTAUTH_URL`

## Documentation

- Architecture: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

## Status

This is a diploma thesis project under active refinement.
