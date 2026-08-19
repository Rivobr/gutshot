-- Витрина достижений игрока: id из клиентского каталога достижений.
ALTER TABLE "User" ADD COLUMN "pinnedAchievements" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
