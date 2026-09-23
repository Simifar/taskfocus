# Зависимости и security baseline

Дата проверки: 2026-09-23.

## Policy

- Основной package manager — npm.
- Единственный lock-файл — `package-lock.json`.
- Major upgrades не выполняются автоматически вместе с cleanup.
- `npm audit fix --force` не используется без отдельного review и полного regression run.

## Cleanup

Удалены прямые зависимости, которые не импортируются приложением: MDX editor, syntax highlighter, Socket.IO, UUID, z-ai SDK, `@reactuses/core` и Recharts. Это уменьшило production dependency graph и убрало связанные с ними advisory.

Обновлены совместимые версии Next.js/ESLint config до `16.3.6`, NextAuth до `4.24.15`, Prisma Client/CLI до `6.19.3` и Sharp до `0.35.4`.

## Current audit result

`npm audit --omit=dev` оставляет 3 high advisory в Prisma config chain (`prisma` → `@prisma/config` → `deepmerge-ts`). npm предлагает downgrade Prisma до `6.12.0`; он не применён автоматически, поскольку это не подтверждённый security fix для текущего runtime и может откатить исправления. Перед production release нужно повторить audit и проверить upstream advisory/совместимую исправленную Prisma версию.

Проверки приложения выполняются командами:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```
