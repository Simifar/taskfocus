# Phase 4 — дизайн миграции данных

Статус: design only. Эта фаза не меняет production database, не добавляет migration в `prisma/migrations` и не выполняет `prisma db push` или `prisma migrate deploy`.

## Текущий baseline

Текущая PostgreSQL-модель содержит:

- `User.timezone` отсутствует;
- `Task` хранит планирование в `dueDateStart` и `dueDateEnd` как `DateTime?`;
- `Task.energyLevel` используется одновременно как оценка сложности;
- дата архивации отсутствует, поэтому `updatedAt` нельзя считать датой архивации;
- единственная migration — `prisma/migrations/0001_initial`.

Phase 1 уже ввела date-only semantics на границе API, но физическая схема пока осталась legacy-compatible.

## Целевая модель

Предлагается отдельная migration после проверки данных:

| Модель | Новое поле | Решение |
|---|---|---|
| `User` | `timezone String @default("UTC")` | Для существующих пользователей сначала `UTC`; автоматическое угадывание timezone запрещено. |
| `Task` | `startDate DateTime?` | Каноническая дата хранится как UTC midnight, отображение зависит от timezone пользователя. |
| `Task` | `endDate DateTime?` | Включительная дата окончания, также UTC midnight. |
| `Task` | `effortLevel Int @default(3)` | Копируется из `energyLevel`; диапазон 1–5. |
| `Task` | `archivedAt DateTime?` | Заполняется только переходом в архив после миграции. |

На compatibility period старые `dueDateStart/dueDateEnd` нужно оставить. Удалять их можно только отдельной migration после перевода всех readers/writers и проверки production rows.

Не добавлять в эту модель `FocusSession`, tags, projects, recurring rules или reminders.

## Конвертация legacy dates

Для каждой строки `Task` создаётся audit result:

| Legacy состояние | Target состояние | Риск |
|---|---|---|
| обе даты `NULL` | обе даты `NULL` | нет |
| только `dueDateStart` | `startDate` равен локальной календарной дате старта, `endDate = NULL` | источник timezone нужно зафиксировать |
| обе даты заданы | обе календарные даты после конвертации в выбранном source timezone | граница суток может изменить дату |
| только `dueDateEnd` | не конвертировать автоматически | строка попадает в quarantine |

Source timezone нельзя достоверно восстановить из существующих строк. До миграции нужно выбрать один из вариантов:

1. зафиксировать `UTC` как source timezone и принять audit warning;
2. получить timezone пользователя из внешнего источника;
3. остановить migration до ручной обработки affected rows.

Рекомендуется вариант 1 только для rows без неоднозначных границ и вариант 3 для end-only/сомнительных rows.

`effortLevel` backfill:

- `1..5` копируется из `energyLevel`;
- `NULL` или значение вне диапазона попадает в audit error и получает временный fallback `3` только после подтверждения;
- `energyLevel` не удаляется до завершения compatibility period.

`archivedAt` backfill:

- для будущих archive transitions записывается текущее время перехода;
- для уже архивных задач оставляется `NULL`, потому что `updatedAt` не доказывает момент архивации;
- подстановка `updatedAt` как фактической даты архивации запрещена.

## Preflight checks

До создания migration нужно выполнить на read-only clone или disposable database:

```sql
SELECT COUNT(*) AS total_tasks FROM tasks;
SELECT COUNT(*) AS end_only_tasks
FROM tasks
WHERE "dueDateStart" IS NULL AND "dueDateEnd" IS NOT NULL;
SELECT COUNT(*) AS invalid_energy_tasks
FROM tasks
WHERE "energyLevel" IS NULL OR "energyLevel" < 1 OR "energyLevel" > 5;
SELECT COUNT(*) AS archived_tasks
FROM tasks
WHERE "status" = 'archived';
SELECT "userId", COUNT(*)
FROM tasks
GROUP BY "userId";
```

Migration не должна продолжаться, если `end_only_tasks > 0` или есть строки с invalid energy без согласованного fallback.

## План migration

1. Создать backup PostgreSQL (`pg_dump --format=custom`) и disposable restore.
2. Выполнить preflight queries и сохранить audit report рядом с release evidence.
3. Добавить nullable target columns и индексы без удаления legacy columns.
4. Заполнить `User.timezone = 'UTC'` только для существующих пользователей.
5. Конвертировать task dates с записью каждого warning/error.
6. Заполнить `effortLevel` и проверить диапазон 1–5.
7. Запустить compatibility query smoke tests и seed на disposable database.
8. Переключить application readers/writers на target fields.
9. Наблюдать один release cycle.
10. Отдельно удалить legacy fields после подтверждения отсутствия обращений к ним.

## Rollback и recovery

У migration должен быть forward-only rollback plan: восстановление backup в новую database и переключение `DATABASE_URL` после проверки. Не полагаться на автоматически сгенерированный down migration для восстановления данных.

Перед production rollout обязательны:

- backup checksum и время создания;
- проверка restore на disposable database;
- список affected users/tasks;
- сохранённый audit report;
- обратимый способ вернуть прежний connection string;
- явное подтверждение перед применением migration.

## Fixtures

`prisma/fixtures/phase4-migration-fixture.json` содержит минимальные legacy cases для проверки конвертера: no-date, start-only, full-range, end-only, archived и invalid energy. Fixture не содержит реальные credentials или production IDs.
