# Neon Deployment Guide

This guide reflects the current TaskFocus setup: `Next.js + Prisma + Neon + Vercel`.

## Goal

Use Neon as the production PostgreSQL database for the deployed Vercel app.

## 1. Create a Neon database

- create a project in Neon
- create a database and copy the connection string
- make sure SSL is enabled

Expected format:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
```

TaskFocus appends serverless-friendly query params in `src/server/db.ts`, so you do not need to manually add `connection_limit=1` unless you want to.

## 2. Configure Vercel environment variables

Set these variables in Vercel:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require
JWT_SECRET=your-random-32-char-secret
NEXTAUTH_SECRET=your-second-random-32-char-secret
NEXTAUTH_URL=https://YOUR_DOMAIN
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## 3. Apply schema to Neon

From your local machine:

```bash
npx prisma generate
npx prisma db push
```

Optional demo data:

```bash
npm run db:seed
```

## 4. Google OAuth for production

In Google Cloud Console add:

- `https://YOUR_DOMAIN/api/auth/callback/google`

If you also work locally, keep:

- `http://localhost:3000/api/auth/callback/google`

## 5. Verify deployment

After deploying to Vercel, verify:

- the app opens without server errors
- login/register works
- Google OAuth returns to the deployed app
- `/api/auth/me` returns the current user after login
- tasks can be created and fetched from Neon

## Common issues

### Google account picker opens, then nothing happens

Check these first:

- `NEXTAUTH_URL` matches the real deployed domain
- Google callback URI exactly matches `https://YOUR_DOMAIN/api/auth/callback/google`
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in Vercel

### Prisma commands fail locally

Check:

- `.env` exists
- `DATABASE_URL` points to the correct Neon database
- SSL is enabled in the URL

### Production works, local auth does not

Check:

- local `.env` uses `NEXTAUTH_URL=http://localhost:3000`
- Google Cloud Console includes the localhost callback URI

## Notes

- Vercel region and proxy behavior are configured separately from Neon
- Prisma CLI config is stored in `prisma.config.ts`
- production DB is PostgreSQL only; old SQL Server references should be treated as obsolete
