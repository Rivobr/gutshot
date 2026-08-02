-- Уникальность никнеймов без учёта регистра.
-- Сначала разводим уже существующие дубликаты, затем ставим индекс.

WITH ranked AS (
  SELECT
    u.id AS user_id,
    u.nickname AS nick,
    ROW_NUMBER() OVER (
      PARTITION BY lower(u.nickname)
      ORDER BY u."createdAt" ASC, u.id ASC
    ) AS rn
  FROM "User" AS u
  WHERE u.nickname IS NOT NULL AND TRIM(u.nickname) <> ''
)
UPDATE "User" AS u
SET nickname = LEFT(TRIM(r.nick), GREATEST(1, 32 - LENGTH(' ' || r.rn::text))) || ' ' || r.rn::text
FROM ranked AS r
WHERE u.id = r.user_id
  AND r.rn > 1;

-- На всякий случай добиваем коллизии после суффиксов (редкий крайний случай).
WITH ranked AS (
  SELECT
    u.id AS user_id,
    ROW_NUMBER() OVER (
      PARTITION BY lower(u.nickname)
      ORDER BY u."createdAt" ASC, u.id ASC
    ) AS rn
  FROM "User" AS u
  WHERE u.nickname IS NOT NULL AND TRIM(u.nickname) <> ''
)
UPDATE "User" AS u
SET nickname = LEFT(u.id, 8) || '-' || RIGHT(u.id, 4)
FROM ranked AS r
WHERE u.id = r.user_id
  AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS "User_nickname_lower_key"
ON "User" (lower(nickname))
WHERE nickname IS NOT NULL;
