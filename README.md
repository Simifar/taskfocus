# TaskFocus

TaskFocus — full-stack приложение на русском языке для спокойного планирования задач. Оно ограничивает дневной список пятью активными задачами, поддерживает мягкие диапазоны дат, входящие задачи без даты, подзадачи и локальный фокус-таймер.

## Возможности

- Today с каноническим лимитом `5` активных задач и детерминированной рекомендацией следующего шага;
- быстрый capture в Inbox без обязательной классификации;
- мягкие даты `dueDateStart` / `dueDateEnd`, неделя, календарь и отдельный день;
- подзадачи только одного уровня;
- выполнение, архивирование, восстановление и подтверждаемое удаление задач;
- фильтр по уровню энергии `1..5` без изменения дневного лимита;
- профиль, статистика календарной недели и локальный 25-минутный focus timer;
- email/password через NextAuth Credentials и необязательный Google OAuth.

## Стек

| Слой | Технологии |
|---|---|
| Frontend | Next.js 16 App Router, React 19, TypeScript |
| UI | Tailwind CSS v4, shadcn/ui, Radix UI, lucide-react |
| Server state | TanStack Query |
| UI state | Zustand |
| Backend | Next.js Route Handlers |
| Database | PostgreSQL / Neon |
| ORM | Prisma |
| Auth | NextAuth JWT session, Credentials, optional Google OAuth |

## Быстрый запуск

Текущий основной workflow — Node.js и npm; `package-lock.json` является единственным lock-файлом проекта.

Требуется Node.js `20.9+` и PostgreSQL/Neon.

```bash
npm ci
cp .env.example .env
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Приложение будет доступно по адресу `http://localhost:3000`.

`db:push` и `db:seed` предназначены для локальной разработки. Production-схему нельзя менять автоматически при деплое; миграции требуют отдельного review и подтверждения.

Демо-пользователь после `npm run db:seed`:

```text
email: demo@taskfocus.app
password: demo1234
```

## Скрипты

| Команда | Назначение |
|---|---|
| `npm run dev` | Запуск dev-сервера |
| `npm run build` | Prisma generate и production-сборка |
| `npm run start` | Запуск production-сервера |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript без генерации файлов |
| `npm test` | Unit/domain tests |
| `npm run check` | lint + typecheck + tests |
| `npm run db:generate` | Генерация Prisma Client |
| `npm run db:push` | Синхронизация схемы с локальной БД |
| `npm run db:migrate` | Локальная Prisma migration после review |
| `npm run db:seed` | Локальные демо-данные |

## Архитектура и документация

- [Локальная настройка](docs/SETUP.md)
- [Архитектура](docs/ARCHITECTURE.md)
- [Зависимости и security baseline](docs/DEPENDENCIES.md)
- [Дизайн будущей migration](docs/PHASE4-MIGRATION-DESIGN.md)
- [Контекст дипломной работы](docs/THESIS.md)
- [План releases](docs/RELEASES.md)

Client dashboard получает server state через TanStack Query и Route Handlers `/api/*`. Сервер проверяет session и ownership пользователя перед каждой операцией; Prisma работает с PostgreSQL.

## Vercel

Для проекта Vercel нужны переменные `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`; Google OAuth добавляется через `GOOGLE_CLIENT_ID` и `GOOGLE_CLIENT_SECRET`. Build command — `npm run build`. После push в `main` GitHub/Vercel integration создаёт deployment, но состояние deployment нужно проверять отдельно от локального build.

## Статус

Проект находится в активной разработке в рамках дипломной работы. Дизайн миграции date-only/`archivedAt` пока не применён к production database.
