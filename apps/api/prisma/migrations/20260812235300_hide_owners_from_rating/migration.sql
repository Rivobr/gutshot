-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "hiddenFromRating" BOOLEAN NOT NULL DEFAULT false;

-- Club owners: keep XP, never appear in rating tables.
UPDATE "User"
SET "hiddenFromRating" = true
WHERE lower(regexp_replace(coalesce("username", ''), '^@', '')) IN ('ingra_admin', 'gargona52');

-- Drop already stored weekly-final slots so they do not occupy top-7.
DELETE FROM "WeeklyFinalQualification"
WHERE "userId" IN (
  SELECT id FROM "User" WHERE "hiddenFromRating" = true
);
