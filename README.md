## TaskFocus (диплом) — to-do приложение с углублённым функционалом

### Стек
- **Next.js (App Router)**, **React**, **TypeScript**
- **Tailwind + shadcn/ui**
- **Prisma + SQL Server**

### Быстрый старт (dev)
1) Установи зависимости:

```bash
bun install
```

2) Создай `.env` на базе `.env.example` и заполни значения:
- **`DATABASE_URL`** (SQL Server)
- **`JWT_SECRET`**

3) Prisma:

```bash
bun run db:generate
bun run db:migrate
```

4) Запуск:

```bash
bun run dev
```

Открой `http://localhost:3000`.

### SQL Server заметки
- Проект ожидает SQL Server, доступный по `DATABASE_URL`.
- Для локальной разработки обычно достаточно `trustServerCertificate=true`.

### Основные команды
- **Dev**: `bun run dev`
- **Build**: `bun run build`
- **Start**: `bun run start`
- **Миграции**: `bun run db:migrate`

