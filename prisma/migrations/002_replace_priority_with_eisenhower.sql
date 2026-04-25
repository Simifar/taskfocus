ALTER TABLE "tasks"
ADD COLUMN IF NOT EXISTS "important" BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "urgent" BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE "tasks"
SET
  "important" = CASE WHEN "priority" IN ('high', 'medium') THEN TRUE ELSE FALSE END,
  "urgent" = CASE WHEN "priority" = 'high' THEN TRUE ELSE FALSE END
WHERE "priority" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "tasks_userId_important_urgent_idx"
ON "tasks"("userId", "important", "urgent");

ALTER TABLE "tasks" DROP COLUMN IF EXISTS "priority";

DROP TYPE IF EXISTS "Priority";
