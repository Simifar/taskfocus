# GitHub Releases

Документ описывает, как оформить историю разработки TaskFocus через GitHub Releases.

## Зачем нужны Releases для диплома

Releases показывают, что проект развивался поэтапно:

- сначала был реализован MVP;
- затем добавлялась авторизация;
- потом укреплялась инфраструктура;
- затем улучшались UX и профиль;
- после эксперимента с i18n проект был приведен к русскоязычной версии.

Это удобно использовать в дипломе как подтверждение итерационной разработки.

## Текущее состояние

На момент подготовки документа в репозитории нет git tags. Releases можно создать задним числом по значимым коммитам.

Проверка:

```bash
git tag --list
```

## Рекомендуемая release-линейка

### `v0.1.0` - Core Task Manager MVP

Смысл релиза:

- базовая работа с задачами;
- мобильный UI;
- архивирование;
- основные представления dashboard.

Пример описания:

```md
## Core Task Manager MVP

Первый устойчивый MVP TaskFocus:

- создание и управление задачами;
- базовая мобильная адаптация;
- архив задач;
- первые dashboard-представления.
```

### `v0.2.0` - Authentication and Deployment Foundation

Смысл релиза:

- email/password auth;
- Google OAuth через NextAuth;
- подготовка Vercel + Neon;
- исправления login/logout;
- server-side auth helpers.

Связанные коммиты из истории:

- `89706a0 feat(auth): add Google OAuth via NextAuth.js`
- `9ea7b77 fix/google-oauth-flow-and-config`
- `cfe23d8 chore/align-infra-with-vercel-and-neon`
- `6d712ce fix/auth-session-race-after-login`
- `d6e43fb fix: login and logout`

### `v0.3.0` - Reliability and API Hardening

Смысл релиза:

- Prisma enums для статусов и приоритетов;
- централизованные constants для energy/task scheduling;
- request timeout в `apiFetch`;
- structured logging;
- error boundaries;
- security headers;
- optimistic updates.

Связанные коммиты:

- `c52f21e refactor: replace string fields with Prisma enums`
- `5a9c7f8 refactor: centralize energy level constants`
- `cd11cdb feat: add request timeout and fix 204 handling in apiFetch`
- `b94425e feat: add structured logging module`
- `8c00566 feat: add Next.js App Router error boundaries`
- `0a5aa7e feat: add Content-Security-Policy and HSTS security headers`
- `bacbb78 feat: add optimistic updates to task mutations`

### `v0.4.0` - UX and Profile Improvements

Смысл релиза:

- новая типографика;
- единый brand token;
- улучшение карточек задач;
- русификация навигации;
- улучшение auth UX;
- профиль со skeleton loading и статистикой.

Связанные коммиты:

- `2585392 feat: add comprehensive typography system`
- `fdc3b8e design: унификация цветовой системы`
- `0ba8987 design: упрощение карточки задачи`
- `6ae1e2f design: навигация`
- `6db5a75 design: auth UX`
- `33cbf2b feat: redesign profile page with skeletons and stats`

### `v0.5.0` - Russian-Only Product Version

Смысл релиза:

- отказ от i18n-слоя;
- чистый русскоязычный интерфейс;
- нормализация дат;
- удаление неиспользуемых i18n-зависимостей;
- исправление lint-проблем.

Связанные коммиты:

- `744ea41 feat: add i18n system with ru/en support`
- `36ec239 remove i18n`
- `36b3c1f fix: remove unused i18n traces and normalize Russian UI`

Важно: в release notes можно честно написать, что i18n был экспериментом, после которого принято решение оставить один язык для дипломного продукта.

## Как создать теги

Команды нужно выполнять от более старых релизов к новым.

Пример:

```bash
git tag -a v0.5.0 36b3c1f -m "v0.5.0 Russian-only product version"
git push origin v0.5.0
```

Для старых релизов нужно выбрать конкретные commit hash из истории:

```bash
git log --oneline --decorate --all
```

Затем:

```bash
git tag -a v0.4.0 <commit-hash> -m "v0.4.0 UX and profile improvements"
git push origin v0.4.0
```

## Готовые release notes

Для публикации подготовлены файлы:

- `docs/releases/v0.1.0.md`
- `docs/releases/v0.2.0.md`
- `docs/releases/v0.3.0.md`
- `docs/releases/v0.4.0.md`
- `docs/releases/v0.5.0.md`

Их можно использовать как основу для GitHub UI или передать в GitHub CLI через `--notes-file`.

## Как создать GitHub Release

Через UI:

1. Открыть GitHub repository.
2. Перейти в `Releases`.
3. Нажать `Draft a new release`.
4. Выбрать tag.
5. Заполнить title и описание.
6. Нажать `Publish release`.

Через GitHub CLI:

```bash
gh release create v0.5.0 \
  --title "v0.5.0 - Russian-Only Product Version" \
  --notes-file docs/releases/v0.5.0.md
```

Если использовать `--notes-file`, можно завести отдельную папку `docs/releases/` с текстами release notes.

## Шаблон release notes

```md
## Summary

Краткое описание релиза.

## Added

- Новая функциональность.

## Changed

- Изменения существующего поведения.

## Fixed

- Исправления ошибок.

## Technical

- Технические изменения: миграции, безопасность, refactoring.

## Verification

- `npm run lint`
- `npm run build`
```

## Рекомендация для диплома

Для защиты достаточно оформить 4-5 релизов:

1. `v0.1.0` - MVP.
2. `v0.2.0` - Auth and deployment.
3. `v0.3.0` - Reliability and security.
4. `v0.4.0` - UX/profile.
5. `v0.5.0` - Russian-only final product.

Такой набор показывает развитие проекта без перегрузки мелкими исправлениями.
