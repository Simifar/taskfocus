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
| `features/dashboard` | Основной интерфейс планирования, views, dashboard actions, Zustand store |
| `features/profile` | Страница профиля |
| `features/stats` | Получение статистики |

Такой подход ближе к feature-based architecture: код группируется по пользовательским возможностям, а не только по техническому типу файла.

## App Router модель

Приложение использует Next.js App Router, но основной dashboard работает как интерактивное client-heavy приложение:

- `src/app/layout.tsx` остается серверным layout;
- `src/app/page.tsx` выполняет server-side проверку NextAuth session и защищает dashboard;
- `src/app/login/page.tsx` и `src/app/register/page.tsx` — отдельные public routes, использующие общий `AuthPage` и визуальный `AuthShell`;
- dashboard получает данные через TanStack Query и `/api/*`;
- API route handlers выполняют серверную валидацию, авторизацию и работу с БД.

Это осознанный компромисс: для таск-менеджера важны быстрые локальные реакции, optimistic updates, drag and drop и состояние фильтров. В будущем часть первичной загрузки можно перенести в Server Components, но это не является блокером для текущего дипломного MVP.

## Навигация dashboard

На широких экранах `DashboardSidebar` показывает все разделы сбоку. На мобильных экранах `MobileNavigation` показывает нижнюю панель с разделами «Сегодня», «Входящие», «План», действием создания задачи и меню «Ещё». Меню открывается снизу и содержит календарь, матрицу, архив, профиль и выход.

Текущий раздел хранится в Zustand store dashboard. При открытии отдельного дня нижняя панель отмечает раздел, из которого этот день был открыт. Панель находится в потоке layout под прокручиваемой областью задач и учитывает нижнюю безопасную зону экрана.

## Backend и API

Backend реализован через Next.js Route Handlers:

| Endpoint | Назначение |
|---|---|
| `/api/auth/register` | Регистрация |
| `/api/auth/me` | Текущий пользователь |
| `/api/auth/profile` | Обновление профиля |
| `/api/auth/account` | Удаление аккаунта |
| `/api/auth/[...nextauth]` | Credentials и Google OAuth через NextAuth |
| `/api/tasks` | Список и создание задач |
| `/api/tasks/[id]` | Получение, обновление, удаление задачи |
| `/api/tasks/reorder` | Сохранение порядка задач |
| `/api/tasks/batch` | Атомарные batch archive/delete/date operations |
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

Email/password и Google OAuth используют один NextAuth session source с `jwt` session strategy. Пароли проверяются через Credentials provider и `bcryptjs`, OAuth accounts хранятся через Prisma Adapter. `getCurrentUser()` получает user id из NextAuth session и затем проверяет пользователя в Prisma.

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
| `important`, `urgent` | признаки для квадранта матрицы Эйзенхауэра |
| `energyLevel` | Сложность/энергозатратность задачи от `1` до `5` |
| `dueDateStart` | Начало мягкого дедлайна |
| `dueDateEnd` | Конец мягкого дедлайна |
| `parentTaskId` | Связь подзадачи с родительской задачей |
| `position` | Ручная сортировка |
| `completedAt` | Дата выполнения |

В текущей схеме нет `archivedAt`; архив не показывает `updatedAt` как дату архива, чтобы не выдавать неверную семантику. Целевое поле и безопасный rollout описаны в [дизайне Phase 4](PHASE4-MIGRATION-DESIGN.md).

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

## Проверки

Основной локальный gate состоит из `npm run lint`, `npm run typecheck`, `npm test` и `npm run build`. В репозитории есть domain/unit tests для date policy, auth policy, task service, plan views, Inbox capture, Today recommendation и focus timer. Автоматического authenticated E2E/browser harness пока нет; интеграционный сценарий dashboard требует тестовой PostgreSQL database и browser session.

## Безопасность

В проекте реализованы:

- httpOnly cookie lifecycle NextAuth;
- server-side authorization в API handlers;
- rate limiting для login/register;
- security headers в `next.config.ts`;
- CSP, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`;
- Prisma-запросы с фильтрацией по `userId`.

Главная dashboard page и profile page проверяются на сервере, а API дополнительно защищён `withAuth(...)`.

## Инфраструктура

Целевая схема деплоя:

- Vercel для Next.js приложения;
- Neon PostgreSQL для БД;
- Prisma Client как ORM;
- переменные окружения в Vercel Project Settings.

`src/server/db.ts` добавляет Neon-friendly параметры подключения, если они отсутствуют в `DATABASE_URL`.

## Текущие архитектурные ограничения

- Dashboard actions вынесены в отдельный hook, но `dashboard-layout.tsx` все еще отвечает за композицию всех представлений.
- Некоторые UI-компоненты крупные и требуют декомпозиции.
- Migration design для новых date-only полей и `archivedAt` ещё не применён к базе.
- Unit/domain tests есть, но автоматического authenticated E2E/browser harness пока нет.
- ESLint настроен мягко и часть правил отключена.

## Рекомендуемые следующие шаги

1. Подготовить и отдельно согласовать migration для date-only полей и `archivedAt`.
2. Добавить E2E smoke-тесты для auth, task CRUD и mobile dashboard.
3. Разделить `sortable-tasks-list.tsx` на draggable wrapper, task row и subtask integration.
4. Постепенно ужесточать ESLint.
5. Рассмотреть server-side защиту страниц через middleware/proxy.
