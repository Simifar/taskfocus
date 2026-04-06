# TaskFocus: API Контракты

**Базовый URL:** `http://localhost:5000/api`

---

## 📋 Содержание

1. [Аутентификация](#аутентификация)
2. [Задачи](#задачи)
3. [Подзадачи](#подзадачи)
4. [Фильтрация](#фильтрация)

---

## Аутентификация

### POST /api/auth/register
Регистрация нового пользователя

**Request:**
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "username": "username"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "token": "jwt-token-here"
  },
  "error": null
}
```

---

### POST /api/auth/login
Вход в систему

**Request:**
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "token": "jwt-token-here"
  },
  "error": null
}
```

---

## Задачи

### GET /api/tasks
Получить список задач текущего пользователя

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
```
?status=active          // active, completed, archived
?energy=3               // 1-5
?priority=high          // low, medium, high
?search=текст           // поиск по названию
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "title": "Подготовить презентацию",
        "description": "Описание задачи",
        "status": "active",
        "priority": "high",
        "energyLevel": 4,
        "dueDateStart": "2025-04-01",
        "dueDateEnd": "2025-04-03",
        "subtasks": [
          {
            "id": "uuid",
            "title": "Собрать материалы",
            "status": "completed"
          }
        ],
        "createdAt": "2025-03-20T10:00:00Z",
        "completedAt": null
      }
    ],
    "totalCount": 15,
    "activeCount": 3
  },
  "error": null
}
```

---

### GET /api/tasks/{id}
Получить одну задачу

**Headers:**
```
Authorization: Bearer {token}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Подготовить презентацию",
    "description": "Описание задачи",
    "status": "active",
    "priority": "high",
    "energyLevel": 4,
    "dueDateStart": "2025-04-01",
    "dueDateEnd": "2025-04-03",
    "subtasks": [...],
    "createdAt": "2025-03-20T10:00:00Z"
  },
  "error": null
}
```

---

### POST /api/tasks
Создать задачу

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request:**
```json
{
  "title": "Новая задача",
  "description": "Описание (опционально)",
  "priority": "medium",
  "energyLevel": 3,
  "dueDateStart": "2025-04-01",
  "dueDateEnd": "2025-04-05"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Новая задача",
    "status": "active",
    ...
  },
  "error": null
}
```

**Response 400 (лимит превышен):**
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "TASK_LIMIT_EXCEEDED",
    "message": "Максимум 3 активные задачи. Завершите или отложите существующую."
  }
}
```

---

### PUT /api/tasks/{id}
Обновить задачу

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request:**
```json
{
  "title": "Обновлённое название",
  "description": "Новое описание",
  "priority": "high",
  "energyLevel": 5,
  "dueDateStart": "2025-04-10",
  "dueDateEnd": "2025-04-15",
  "status": "active"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

---

### DELETE /api/tasks/{id}
Удалить задачу (soft delete)

**Headers:**
```
Authorization: Bearer {token}
```

**Response 204:** (No Content)

---

### POST /api/tasks/{id}/complete
Отметить задачу выполненной

**Headers:**
```
Authorization: Bearer {token}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "completed",
    "completedAt": "2025-03-20T15:30:00Z"
  },
  "error": null
}
```

---

## Подзадачи

### POST /api/tasks/{taskId}/subtasks
Добавить подзадачу

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request:**
```json
{
  "title": "Подзадача",
  "energyLevel": 2
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Подзадача",
    "status": "active",
    "parentTaskId": "uuid"
  },
  "error": null
}
```

---

### PUT /api/subtasks/{id}/complete
Отметить подзадачу выполненной

**Headers:**
```
Authorization: Bearer {token}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "completed"
  },
  "error": null
}
```

---

## Фильтрация

### GET /api/tasks?energy={level}
Фильтр по уровню энергии

**Пример:** `GET /api/tasks?energy=3`

Возвращает задачи с energyLevel ≤ 3

---

### GET /api/tasks/by-energy
Получить задачи, подходящие под текущую энергию

**Headers:**
```
Authorization: Bearer {token}
```

**Query:**
```
?currentEnergy=3
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "matching": [...],      // energyLevel <= 3
    "challenging": [...],   // energyLevel = 4
    "tooHard": [...]        // energyLevel = 5
  },
  "error": null
}
```

---

## 📊 Enums

### TaskStatus
```
active      - Активная
completed   - Выполнена
archived    - В архиве
```

### Priority
```
low     = 1
medium  = 2
high    = 3
```

### EnergyLevel
```
1 = Очень низкий
2 = Низкий
3 = Средний
4 = Высокий
5 = Очень высокий
```

---

## 🔐 Авторизация

Все endpoints (кроме /auth/**) требуют заголовок:
```
Authorization: Bearer {jwt-token}
```

---

## ⚠️ Коды ошибок

| Код | Описание |
|-----|----------|
| `UNAUTHORIZED` | Нет токена или токен невалиден |
| `VALIDATION_ERROR` | Ошибка валидации входных данных |
| `TASK_LIMIT_EXCEEDED` | Превышен лимит в 3 активные задачи |
| `TASK_NOT_FOUND` | Задача не найдена |
| `FORBIDDEN` | Нет доступа к чужой задаче |

---

## 📝 Примечания для фронтенда

1. **Лимит задач:** Перед созданием проверяй `activeCount` в ответе GET /api/tasks
2. **Мягкие дедлайны:** Отображай как диапазон "01.04 - 03.04"
3. **Энергия:** Используй цветовую индикацию (1-2 зелёный, 3 жёлтый, 4-5 красный)
4. **Подзадачи:** Не учитываются в лимите 3 задач

---

**Последнее обновление:** 2025-03-01
