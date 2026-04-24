# TaskFocus

TaskFocus - дипломный full-stack проект: веб-приложение для планирования задач с учетом когнитивной нагрузки пользователя. Приложение помогает ограничивать фокус, выбирать задачи по уровню энергии и работать с мягкими дедлайнами вместо жестких дат.

## Идея проекта

Обычные таск-менеджеры часто показывают пользователю длинный список задач и усиливают перегрузку. TaskFocus предлагает более щадящую модель:

- не больше `5` активных задач на сегодня;
- уровень энергии задачи от `1` до `5`;
- мягкий дедлайн как диапазон дат;
- входящие задачи без даты;
- подзадачи для декомпозиции крупных дел;
- календарь, неделя, день, архив и статистика;
- русскоязычный интерфейс без i18n-слоя.

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
| Auth | Custom JWT auth + NextAuth Google OAuth |

## Основные возможности

- Регистрация и вход по email/password.
- Вход через Google OAuth.
- Создание, редактирование, выполнение, архивирование и удаление задач.
- Подзадачи с отдельным статусом выполнения.
- Приоритеты `low | medium | high`.
- Уровни энергии `1..5`.
- Мягкие дедлайны `dueDateStart` / `dueDateEnd`.
- Ограничение количества активных задач на сегодня.
- Представления: сегодня, входящие, неделя, календарь, день, архив.
- Профиль пользователя и статистика.

## Быстрый запуск

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

После запуска приложение доступно по адресу `http://localhost:3000`.

Демо-пользователь после `npm run db:seed`:

```text
email: demo@taskfocus.app
password: demo1234
```

## Скрипты

| Команда | Назначение |
|---|---|
| `npm run dev` | Запуск dev-сервера |
| `npm run build` | Production-сборка |
| `npm run start` | Запуск production-сервера |
| `npm run lint` | Проверка ESLint |
| `npm run db:generate` | Генерация Prisma Client |
| `npm run db:push` | Синхронизация схемы с БД |
| `npm run db:migrate` | Dev-миграции Prisma |
| `npm run db:reset` | Сброс БД |
| `npm run db:seed` | Демо-данные |

## Документация

- [Локальная настройка](docs/SETUP.md)
- [Архитектура](docs/ARCHITECTURE.md)
- [Контекст дипломной работы](docs/THESIS.md)
- [План GitHub Releases](docs/RELEASES.md)

## Статус

Проект находится в стадии активной доработки в рамках дипломной работы.
