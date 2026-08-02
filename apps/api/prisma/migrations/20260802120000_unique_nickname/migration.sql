-- Уникальность никнеймов без учёта регистра.
-- Сначала разводим уже существующие дубликаты, затем ставим индекс.

WITH ranked AS (
  SELECT
    id,
    nickname,
    ROW_NUMBER() OVER (
      PARTITION BY lower(nickname)
      ORDER BY "createdAt" ASC, id ASC
    ) AS rn
  FROM "User"
  WHERE nickname IS NOT NULL AND TRIM(nickname) <> ''
)
UPDATE "User" AS u
SET nickname = LEFT(TRIM(r.nickname), GREATEST(1, 32 - LENGTH(' ' || r.rn::text))) || ' ' || r.rn::text
FROM ranked AS r
WHERE u.id = r.id
  AND r.rn > 1;

-- На всякий случай добиваем коллизии после суффиксов (редкий крайний случай).
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY lower(nickname)
      ORDER BY "createdAt" ASC, id ASC
    ) AS rn
  FROM "User"
  WHERE nickname IS NOT NULL AND TRIM(nickname) <> ''
)
UPDATE "User" AS u
SET nickname = LEFT(id, 8) || '-' || RIGHT(id, 4)
FROM ranked AS r
WHERE u.id = r.id
  AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS "User_nickname_lower_key"
ON "User" (lower(nickname))
WHERE nickname IS NOT NULL;
