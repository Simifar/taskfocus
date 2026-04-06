# TaskFocus: Инструкция по запуску

## Быстрый старт (5 минут)

### 1. Клонируй репозиторий
```bash
git clone https://github.com/ваш-ник/taskfocus.git
cd taskfocus
```

### 2. Запусти всё через Docker
```bash
docker-compose up -d
```

### 3. Открой в браузере
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Swagger UI: http://localhost:5000/swagger

### 4. Остановка
```bash
docker-compose down
```

---

## Разработка (без Docker)

### Backend (Егор)

```bash
cd backend/src/TaskFocus.API
dotnet restore
dotnet ef database update
dotnet run
```

API будет доступен на http://localhost:5000

### Frontend (Степан)

```bash
cd frontend
npm install
npm run dev
```

Frontend будет доступен на http://localhost:5173

---

## Структура проекта

```
taskfocus/
├── backend/          # .NET 8 Web API
│   ├── src/
│   │   ├── TaskFocus.API/
│   │   ├── TaskFocus.Application/
│   │   ├── TaskFocus.Domain/
│   │   └── TaskFocus.Infrastructure/
│   └── Dockerfile
├── frontend/         # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── api/
│   └── Dockerfile
└── docker-compose.yml
```

---

## Полезные команды

### Docker
```bash
# Пересборка после изменений
docker-compose up -d --build

# Просмотр логов
docker-compose logs -f backend
docker-compose logs -f frontend

# Перезапуск одного сервиса
docker-compose restart backend

# Полная очистка
docker-compose down -v
```

### Backend
```bash
# Создать миграцию
dotnet ef migrations add InitialCreate

# Применить миграции
dotnet ef database update

# Запуск тестов
dotnet test
```

### Frontend
```bash
# Установить зависимости
npm install

# Запуск разработки
npm run dev

# Сборка production
npm run build

# Линтинг
npm run lint
```

---

## Переменные окружения

### Backend (.env)
```
ConnectionStrings__Default=Host=localhost;Database=taskfocus;Username=taskfocus;Password=taskfocus
JWT__Secret=your-super-secret-key-min-32-chars
JWT__ExpiryMinutes=60
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
```

---

## Тестовые данные

После запуска API создаёт тестового пользователя:
- Email: test@taskfocus.ru
- Password: Test123!

---

## Проблемы?

### Порт занят
```bash
# Найти процесс
lsof -i :5000

# Или изменить порт в docker-compose.yml
```

### База данных не подключается
```bash
# Проверить, запущен ли PostgreSQL
docker-compose ps

# Пересоздать БД
docker-compose down -v
docker-compose up -d
```

---

## Команда

- **Егор** — Backend (.NET, PostgreSQL)
- **Степан** — Frontend (React, TypeScript)

---

**Удачи в разработке! 🚀**
