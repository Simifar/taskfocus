# Локальная настройка

Документ описывает запуск TaskFocus на локальной машине и минимальную конфигурацию окружения.

## Требования

- Node.js 20+;
- npm;
- PostgreSQL или Neon PostgreSQL;
- Google OAuth Client ID, если нужен вход через Google.

## Установка

```bash
npm install
cp .env.example .env
```

Заполните `.env`, затем выполните:

```bash
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Приложение будет доступно по адресу `http://localhost:3000`.

## Переменные окружения

| Переменная | Обязательна | Назначение |
|---|---:|---|
| `DATABASE_URL` | Да | PostgreSQL / Neon connection string |
| `JWT_SECRET` | Да | Секрет custom JWT для email/password входа |
| `NEXTAUTH_SECRET` | Да | Секрет NextAuth |
| `NEXTAUTH_URL` | Да | Базовый URL приложения |
| `GOOGLE_CLIENT_ID` | Для Google OAuth | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Для Google OAuth | Google OAuth Client Secret |

Минимальный локальный пример:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
JWT_SECRET="replace-with-a-random-string-at-least-32-chars"
NEXTAUTH_SECRET="replace-with-a-second-random-string-at-least-32-chars"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## Google OAuth

В Google Cloud Console нужно создать OAuth Client ID и добавить redirect URI:

```text
http://localhost:3000/api/auth/callback/google
```

Для production нужно добавить URI с реальным доменом:

```text
https://YOUR_DOMAIN/api/auth/callback/google
```

`NEXTAUTH_URL` должен совпадать с доменом, на котором запущено приложение.

## Демо-данные

Команда:

```bash
npm run db:seed
```

Создает пользователя:

```text
email: demo@taskfocus.app
password: demo1234
```

И набор демонстрационных задач.

## Проверки

Перед коммитом желательно запускать:

```bash
npm run lint
npm run build
```

`npm run build` также выполняет `prisma generate`.

## Частые проблемы

### `npm` не запускается в PowerShell

Если PowerShell блокирует `npm.ps1`, используйте:

```powershell
npm.cmd run dev
npm.cmd run lint
npm.cmd run build
```

### Ошибка подключения к БД

Проверьте:

- корректность `DATABASE_URL`;
- наличие `sslmode=require` для Neon;
- что база существует;
- что пароль не содержит неэкранированных спецсимволов.

### Google login возвращает ошибку

Проверьте:

- `NEXTAUTH_URL`;
- redirect URI в Google Cloud Console;
- `GOOGLE_CLIENT_ID`;
- `GOOGLE_CLIENT_SECRET`;
- `NEXTAUTH_SECRET`.
