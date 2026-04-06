# TaskFocus: Командный план разработки
## Егор (Backend) + Степан (Frontend)

---

# 🛠️ СТЕК ТЕХНОЛОГИЙ

## Backend (Егор)

| Компонент | Технология | Почему |
|-----------|------------|--------|
| Язык | C# 12 | Твой основной стек |
| Framework | .NET 8 (LTS) | Долгосрочная поддержка |
| API | ASP.NET Core Web API | Стандарт для REST |
| ORM | Entity Framework Core 8 | Миграции, LINQ |
| БД | PostgreSQL 16 | Бесплатная, надёжная |
| Auth | ASP.NET Core Identity + JWT | Готовое решение |
| Валидация | FluentValidation | Чистый код |
| Логирование | Serilog + Seq | Удобный дебаг |
| Документация | Swagger/OpenAPI | Авто-документация API |
| Тесты | xUnit + Moq | Стандарт для .NET |

## Frontend (Степан)

| Компонент | Технология | Почему |
|-----------|------------|--------|
| Framework | React 18 | Самый популярный |
| Язык | TypeScript | Типизация, меньше багов |
| Стили | Tailwind CSS | Быстрая вёрстка |
| UI Kit | shadcn/ui + Radix | Готовые компоненты |
| State | Zustand | Проще Redux |
| Query | TanStack Query (React Query) | Работа с API |
| Router | React Router 6 | Стандарт |
| Forms | React Hook Form + Zod | Валидация форм |
| HTTP | Axios | Удобнее fetch |
| Build | Vite | Быстрее CRA |

## Инфраструктура (Оба)

| Инструмент | Назначение |
|------------|------------|
| **GitHub** | Репозиторий + Projects (Kanban) |
| **Git Flow** | Стратегия веток |
| **Docker** | Контейнеризация |
| **Docker Compose** | Запуск всего стека локально |
| **GitHub Actions** | CI/CD (опционально) |
| **Postman** | Тестирование API |
| **Figma** | Дизайн (бесплатно для студентов) |

---

# 📁 СТРУКТУРА РЕПОЗИТОРИЯ

```
taskfocus/
├── .github/
│   └── workflows/          # CI/CD (потом)
├── backend/
│   ├── src/
│   │   ├── TaskFocus.API/              # Web API проект
│   │   ├── TaskFocus.Application/      # Сервисы, DTO
│   │   ├── TaskFocus.Domain/           # Сущности, интерфейсы
│   │   ├── TaskFocus.Infrastructure/   # EF, Repositories
│   │   └── TaskFocus.Tests/            # Тесты
│   ├── Dockerfile
│   └── TaskFocus.sln
├── frontend/
│   ├── src/
│   │   ├── components/     # React компоненты
│   │   ├── pages/          # Страницы
│   │   ├── hooks/          # Кастомные хуки
│   │   ├── store/          # Zustand store
│   │   ├── api/            # API клиент
│   │   ├── types/          # TypeScript типы
│   │   └── utils/          # Утилиты
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml      # Запуск всего
├── README.md               # Инструкция по запуску
└── docs/                   # Документация API
```

---

# 🔧 НАСТРОЙКА ОКРУЖЕНИЯ

## Что установить Егору (Backend)

```bash
# 1. .NET 8 SDK
https://dotnet.microsoft.com/download/dotnet/8.0

# 2. IDE
- Visual Studio 2022 (Community) или
- JetBrains Rider (студенческая лицензия бесплатно) или
- VS Code + C# Dev Kit

# 3. База данных
- PostgreSQL 16
- pgAdmin 4 (GUI для БД)
- DBeaver (альтернатива)

# 4. Docker
https://docs.docker.com/get-docker/

# 5. Postman (для тестирования API)
https://www.postman.com/downloads/

# 6. Git
https://git-scm.com/downloads
```

## Что установить Степану (Frontend)

```bash
# 1. Node.js 20 LTS
https://nodejs.org/

# 2. IDE
- VS Code (рекомендую)
- WebStorm (студенческая лицензия)

# 3. VS Code Extensions:
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- TypeScript Importer
- Prettier
- ESLint

# 4. Docker
https://docs.docker.com/get-docker/

# 5. Git
https://git-scm.com/downloads
```

## Общие инструменты

```bash
# GitHub аккаунты (если нет)
https://github.com/

# Figma (для дизайна)
https://figma.com

# Discord/Telegram для связи
```

---

# 🌿 Git Flow (Стратегия веток)

```
main              ← стабильная версия
├── develop       ← разработка
│   ├── feature/auth        ← Степан: авторизация
│   ├── feature/tasks-api   ← Егор: API задач
│   ├── feature/tasks-ui    ← Степан: UI задач
│   └── bugfix/something    ← фиксы
├── release/v1.0  ← подготовка к релизу
└── hotfix        ← срочные фиксы
```

## Правила работы

1. **main** — только рабочий код
2. **develop** — основная ветка разработки
3. **feature/*** — каждая фича в своей ветке
4. **Перед началом работы:** `git pull origin develop`
5. **После завершения:** Pull Request в develop
6. **Код-ревью:** оба смотрят друг друга (кратко)

---

# 📋 ПЛАН РАЗРАБОТКИ (6 недель)

## Неделя 0: Подготовка (Оба)

### Егор:
- [ ] Установить .NET 8, PostgreSQL, Docker
- [ ] Создать репозиторий на GitHub
- [ ] Настроить структуру backend
- [ ] Создать Docker-compose для PostgreSQL

### Степан:
- [ ] Установить Node.js, VS Code
- [ ] Создать React + Vite + TypeScript проект
- [ ] Настроить Tailwind CSS
- [ ] Установить shadcn/ui

### Вместе:
- [ ] Созвон, обсудить дизайн в Figma
- [ ] Определить API контракты ( endpoints )
- [ ] Создать Kanban доску в GitHub Projects

**Результат:** Оба могут запускать проект локально

---

## Неделя 1: MVP Core (Параллельно)

### Егор (Backend):
- [ ] Domain Layer: сущности Task, User
- [ ] EF Core + миграции
- [ ] API: GET /api/tasks, POST /api/tasks
- [ ] Swagger документация

### Степан (Frontend):
- [ ] Страница списка задач (моковые данные)
- [ ] Компонент создания задачи
- [ ] Базовый дизайн (шапка, сайдбар)

### Вместе:
- [ ] Подключить frontend к real API
- [ ] Настроить CORS

**Результат:** Можно создавать и видеть задачи

---

## Неделя 2: Функционал задач

### Егор:
- [ ] CRUD операции (Update, Delete)
- [ ] Подзадачи (иерархия)
- [ ] Фильтрация по статусу
- [ ] Soft delete

### Степан:
- [ ] Редактирование задачи (модалка)
- [ ] Подзадачи (вложенный список)
- [ ] Фильтры (все/активные/выполненные)
- [ ] Drag & Drop для сортировки

**Результат:** Полноценный CRUD задач

---

## Неделя 3: Уникальные фичи (СДВГ-фокус)

### Егор:
- [ ] Ограничение: максимум 3 активные задачи
- [ ] Уровень энергии (1-5)
- [ ] Фильтрация по энергии
- [ ] Мягкие дедлайны (диапазон дат)

### Степан:
- [ ] UI для энергии (слайдер/кнопки)
- [ ] Индикатор "3 из 3" задач
- [ ] Фильтр по энергии
- [ ] Визуализация мягких дедлайнов

**Результат:** Уникальные фичи для СДВГ работают

---

## Неделя 4: Auth + UX

### Егор:
- [ ] Регистрация / Логин (JWT)
- [ ] Авторизация endpoint'ов
- [ ] Пользовательские задачи (изоляция)

### Степан:
- [ ] Страницы Login / Register
- [ ] Защищённые роуты
- [ ] Профиль пользователя
- [ ] Toast-уведомления

**Результат:** Многопользовательское приложение

---

## Неделя 5: Полировка + Тестирование

### Егор:
- [ ] Юнит-тесты (критичные пути)
- [ ] Обработка ошибок
- [ ] Валидация входных данных
- [ ] Docker для production

### Степан:
- [ ] Адаптивная вёрстка (мобильные)
- [ ] Лоадеры, скелетоны
- [ ] Обработка ошибок API
- [ ] Оптимизация производительности

### Вместе:
- [ ] Тестирование всего функционала
- [ ] Фикс багов

**Результат:** Стабильное приложение

---

## Неделя 6: Диплом + Деплой

### Егор:
- [ ] Написать разделы: 4, 5, 6, 7
- [ ] ER-диаграмма
- [ ] API документация

### Степан:
- [ ] Написать разделы: 2.1, 4 (UI часть)
- [ ] Скриншоты интерфейса
- [ ] Описание компонентов

### Вместе:
- [ ] Деплой (бесплатный хостинг)
- [ ] Финальное тестирование
- [ ] Подготовка к защите

**Результат:** Работающее приложение + диплом

---

# 📡 API КОНТРАКТЫ (Договорённости)

## Базовый URL
```
Локально: http://localhost:5000/api
Production: https://api.taskfocus.ru/api
```

## Endpoints (v1)

### Задачи
```
GET    /api/tasks              # Список задач
GET    /api/tasks/{id}         # Одна задача
POST   /api/tasks              # Создать
PUT    /api/tasks/{id}         # Обновить
DELETE /api/tasks/{id}         # Удалить
GET    /api/tasks?energy=3     # Фильтр по энергии
```

### Auth
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
```

## Формат ответа
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

## Формат ошибки
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Максимум 3 активные задачи"
  }
}
```

---

# 🐳 DOCKER (Запуск всего)

## docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: taskfocus
      POSTGRES_PASSWORD: taskfocus
      POSTGRES_DB: taskfocus
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "5000:80"
    environment:
      ConnectionStrings__Default: "Host=postgres;Database=taskfocus;Username=taskfocus;Password=taskfocus"
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

## Команды

```bash
# Запуск всего стека
docker-compose up -d

# Остановка
docker-compose down

# Пересборка
docker-compose up -d --build
```

---

# 🎨 ДИЗАЙН (Figma)

## Структура файла

```
TaskFocus Design
├── 🎨 Design System
│   ├── Цвета
│   ├── Типографика
│   └── Компоненты
├── 📱 Pages
│   ├── Login
│   ├── Register
│   ├── Dashboard (список задач)
│   ├── Task Detail
│   └── Profile
└── 🔄 User Flows
```

## Цветовая схема (пример)

```
Primary:    #6366F1 (Indigo)
Secondary:  #8B5CF6 (Purple)
Success:    #10B981 (Green)
Warning:    #F59E0B (Yellow)
Danger:     #EF4444 (Red)
Background: #F3F4F6 (Gray-100)
Text:       #111827 (Gray-900)
```

---

# 📊 GitHub Projects (Kanban)

## Колонки

```
Backlog → To Do → In Progress → Review → Done
```

## Пример задач

```
[Backend] Создать сущность Task
[Backend] API: GET /api/tasks
[Frontend] Создать компонент TaskCard
[Frontend] Подключить API задач
[Design] Нарисовать страницу Dashboard
[Docs] Написать раздел 4.1
```

## Labels

```
backend
frontend
design
docs
bug
enhancement
```

---

# 🚨 ЧЕК-ЛИСТ: Готовность к старту

## Егор:
- [ ] .NET 8 SDK установлен
- [ ] PostgreSQL установлен
- [ ] Docker установлен
- [ ] GitHub аккаунт создан
- [ ] Можешь создать `dotnet new webapi`

## Степан:
- [ ] Node.js 20 установлен
- [ ] VS Code настроен
- [ ] Docker установлен
- [ ] GitHub аккаунт создан
- [ ] Можешь создать `npm create vite@latest`

## Вместе:
- [ ] Репозиторий создан
- [ ] Оба имеют доступ
- [ ] Первый созвон проведён
- [ ] Figma создана
- [ ] API контракты обсуждены

---

# 💬 КОММУНИКАЦИЯ

## Ежедневно (5 минут)
- Что сделал вчера?
- Что планируешь сегодня?
- Есть ли блокеры?

## Раз в неделю (30 минут)
- Демо прогресса
- Обсуждение сложностей
- Корректировка плана

## Инструменты
- Discord / Telegram — быстрая связь
- GitHub Issues — задачи
- Figma — дизайн
- Google Docs — документы диплома (общий доступ)

---

# 📝 РАЗДЕЛЕНИЕ ДИПЛОМА

## Егор пишет:
- Раздел 1 (Введение) — частично
- Раздел 4 (Проектирование) — архитектура backend, БД
- Раздел 5 (Реализация) — backend
- Раздел 6 (Тестирование) — юнит-тесты
- Раздел 7 (Результаты) — метрики backend

## Степан пишет:
- Раздел 2 (Обзор) — frontend фреймворки, UX
- Раздел 4 (Проектирование) — архитектура frontend
- Раздел 5 (Реализация) — frontend
- Раздел 6 (Тестирование) — UX-тестирование
- Скриншоты интерфейса

## Вместе:
- Раздел 1 (Актуальность, цели)
- Раздел 3 (Постановка задачи)
- Раздел 8 (Экономика)
- Раздел 9 (Заключение)

---

# 🎯 ФИНАЛЬНЫЙ ЧЕК-ЛИСТ

- [ ] Оба установили всё ПО
- [ ] Репозиторий создан и настроен
- [ ] Docker-compose работает
- [ ] Figma с дизайном
- [ ] API контракты определены
- [ ] Первая задача в In Progress

---

**Готовы начать? Созвонитесь, обсудите дизайн в Figma и вперёд! 🚀**
