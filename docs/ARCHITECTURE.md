# Архитектура TaskFocus

Документ описывает фактическую архитектуру проекта. Если код меняется, этот файл нужно обновлять вместе с ним.

## Архитектурная цель

TaskFocus проектируется как небольшое full-stack приложение, которое один разработчик может поддерживать в рамках дипломной работы. Поэтому архитектура выбрана прагматично: feature-based структура, Next.js Route Handlers как backend, Prisma как слой доступа к БД и client-heavy dashboard для высокой интерактивности.

## Высокоуровневая схема

```text
Browser
  |
  | React UI + TanStack Query
  v
Next.js App Router
  |
  | /api/* Route Handlers
  v
Server helpers
  |
  | Prisma Client
  v
PostgreSQL / Neon
```

## Структура каталогов

```text
src/
  app/             Next.js маршруты, layout, error boundaries, API route handlers
  features/        функциональные модули приложения
  server/          server-only логика: auth, db, api envelope, rate limit
  shared/          общие UI-компоненты, типы и утилиты
  types/           глобальные TypeScript-расширения
prisma/            Prisma schema, seed, SQL/migrations
docs/              проектная и дипломная документация
```

## Feature-модули

| Модуль | Ответственность |
|---|---|
| `features/auth` | Клиентские API и hooks для входа, регистрации, logout, профиля |
| `features/tasks` | Клиентские API, hooks и UI-компоненты задач |
| `features/dashboard` | Основной интерфейс планирования, views, Zustand store |
| `features/profile` | Страница профиля |
| `features/stats` | Получение статистики |

Такой подход ближе к feature-based architecture: код группируется по пользовательским возможностям, а не только по техническому типу файла.

## App Router модель

Приложение использует Next.js App Router, но основной dashboard работает как интерактивное client-heavy приложение:

- `src/app/layout.tsx` остается серверным layout;
- `src/app/page.tsx` является client component, потому что выбирает между auth page и dashboard по текущему пользователю;
- dashboard получает данные через TanStack Query и `/api/*`;
- API route handlers выполняют серверную валидацию, авторизацию и работу с БД.

Это осознанный компромисс: для таск-менеджера важны быстрые локальные реакции, optimistic updates, drag and drop и состояние фильтров. В будущем часть первичной загрузки можно перенести в Server Components, но это не является блокером для текущего дипломного MVP.

## Backend и API

Backend реализован через Next.js Route Handlers:

| Endpoint | Назначение |
|---|---|
| `/api/auth/login` | Вход по email/password |
| `/api/auth/register` | Регистрация |
| `/api/auth/logout` | Очистка custom auth cookie |
| `/api/auth/me` | Текущий пользователь |
| `/api/auth/profile` | Обновление профиля |
| `/api/auth/account` | Удаление аккаунта |
| `/api/auth/[...nextauth]` | Google OAuth через NextAuth |
| `/api/tasks` | Список и создание задач |
| `/api/tasks/[id]` | Получение, обновление, удаление задачи |
| `/api/tasks/reorder` | Сохранение порядка задач |
| `/api/subtasks` | Создание подзадачи |
| `/api/stats` | Статистика dashboard |

Все защищенные endpoints используют `withAuth(...)`. Ответы API приводятся к общему envelope-формату:

```ts
type ApiEnvelope<T> =
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: { code: string; message: string } };
```

Клиентские запросы проходят через `apiFetch(...)`, который:

- добавляет `credentials: "include"`;
- сериализует JSON body;
- обрабатывает envelope;
- превращает API-ошибки в `ApiError`;
- ограничивает время запроса.

## Авторизация

В проекте поддерживаются два способа входа:

1. Email/password:
   - пароль хешируется через `bcryptjs`;
   - сервер выпускает JWT через `jose`;
   - токен хранится в httpOnly cookie `auth-token`.

2. Google OAuth:
   - используется `next-auth`;
   - данные OAuth-аккаунта хранятся через Prisma Adapter;
   - session strategy: `jwt`.

`getCurrentUser()` сначала проверяет NextAuth session, затем custom JWT cookie. Это позволяет поддерживать оба сценария, но увеличивает сложность logout/delete-account flow.

## Модель данных

Основные Prisma-модели:

- `User`;
- `Account`;
- `VerificationToken`;
- `Task`.

Ключевые поля `Task`:

| Поле | Смысл |
|---|---|
| `status` | `active`, `completed`, `archived` |
| `priority` | `low`, `medium`, `high` |
| `energyLevel` | Сложность/энергозатратность задачи от `1` до `5` |
| `dueDateStart` | Начало мягкого дедлайна |
| `dueDateEnd` | Конец мягкого дедлайна |
| `parentTaskId` | Связь подзадачи с родительской задачей |
| `position` | Ручная сортировка |
| `completedAt` | Дата выполнения |

## Бизнес-правила

Основные правила вынесены в серверный код:

- пользователь видит и изменяет только свои задачи;
- подзадачи исключаются из главного списка задач;
- дата окончания не может быть раньше даты начала;
- активных задач, запланированных на сегодня, не может быть больше `5`;
- при переводе задачи в `completed` заполняется `completedAt`;
- при возврате из `completed` дата выполнения сбрасывается.

## Состояние на клиенте

Используются два типа состояния:

| Тип | Инструмент | Примеры |
|---|---|---|
| Server state | TanStack Query | задачи, статистика, текущий пользователь |
| UI state | Zustand | текущий раздел dashboard, фильтры, сортировка |

TanStack Query используется для кэширования, invalidation и optimistic updates. Zustand хранит локальные настройки интерфейса и частично сохраняет их в `localStorage`.

## Безопасность

В проекте реализованы:

- httpOnly cookie для custom JWT;
- server-side authorization в API handlers;
- rate limiting для login/register;
- security headers в `next.config.ts`;
- CSP, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`;
- Prisma-запросы с фильтрацией по `userId`.

Важно: защищенность страниц сейчас реализована клиентской проверкой текущего пользователя. API защищен серверно, поэтому данные не отдаются без авторизации. Для production-hardening можно добавить middleware/proxy-level защиту страниц.

## Инфраструктура

Целевая схема деплоя:

- Vercel для Next.js приложения;
- Neon PostgreSQL для БД;
- Prisma Client как ORM;
- переменные окружения в Vercel Project Settings.

`src/server/db.ts` добавляет Neon-friendly параметры подключения, если они отсутствуют в `DATABASE_URL`.

## Текущие архитектурные ограничения

- Dashboard сосредоточивает много orchestration-логики в `dashboard-layout.tsx`.
- Некоторые UI-компоненты крупные и требуют декомпозиции.
- Auth flow смешивает custom JWT и NextAuth, что требует аккуратного сопровождения.
- Нет автоматических unit/e2e тестов.
- ESLint настроен мягко и часть правил отключена.

## Рекомендуемые следующие шаги

1. Вынести dashboard actions из `dashboard-layout.tsx` в отдельный hook.
2. Разделить `inbox-view.tsx` на quick add, filters, batch toolbar, task card и empty state.
3. Добавить unit-тесты для `task-scheduling`.
4. Добавить e2e smoke-тесты для auth и task CRUD.
5. Постепенно ужесточать ESLint.
6. Рассмотреть server-side защиту страниц через middleware/proxy.
