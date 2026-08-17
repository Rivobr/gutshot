-- Георгий Саблин (@geosablin): скрыть из недельного / финального рейтинга.
UPDATE "User"
SET "hiddenFromRating" = true
WHERE lower(regexp_replace(coalesce("username", ''), '^@', '')) = 'geosablin';
