-- Progression v2 data: 250k levels, place XP, week/month rewards, admin accounts.

DELETE FROM "LevelThreshold";
INSERT INTO "LevelThreshold" ("level", "requiredXp")
SELECT
  level,
  CASE
    WHEN level = 1 THEN 0
    WHEN level = 100 THEN 250000
    ELSE ROUND(970 * (level - 1) + 15.7 * (level - 1) * (level - 1))::int
  END AS "requiredXp"
FROM generate_series(1, 100) AS level;

INSERT INTO "XpSetting" ("key", "value", "updatedAt") VALUES
  ('TOURNAMENT_WIN', 3500, NOW()),
  ('PLACE_2', 2800, NOW()),
  ('PLACE_3', 2300, NOW()),
  ('PLACE_4', 2000, NOW()),
  ('PLACE_5', 1800, NOW()),
  ('PLACE_6', 1600, NOW()),
  ('PLACE_7', 1450, NOW()),
  ('PLACE_8', 1300, NOW()),
  ('PLACE_9', 1200, NOW()),
  ('PLACE_10', 1100, NOW()),
  ('PLACE_11', 1000, NOW()),
  ('PLACE_12', 900, NOW()),
  ('PLACE_13', 850, NOW()),
  ('PLACE_14', 800, NOW()),
  ('PLACE_15', 750, NOW()),
  ('PLACE_16', 700, NOW()),
  ('PLACE_17', 650, NOW()),
  ('PLACE_18', 600, NOW()),
  ('PLACE_19', 550, NOW()),
  ('PLACE_20', 500, NOW()),
  ('PLACE_21', 400, NOW()),
  ('PLACE_22', 400, NOW()),
  ('PLACE_23', 400, NOW()),
  ('PLACE_24', 400, NOW()),
  ('PLACE_25', 400, NOW()),
  ('PLACE_26', 300, NOW()),
  ('PLACE_27', 300, NOW()),
  ('PLACE_28', 300, NOW()),
  ('PLACE_29', 300, NOW()),
  ('PLACE_30', 300, NOW()),
  ('PLACE_31_40', 200, NOW()),
  ('PLACE_41_50', 150, NOW()),
  ('PLACE_51_PLUS', 100, NOW()),
  ('WEEKLY_TOP_1', 7500, NOW()),
  ('WEEKLY_TOP_2', 5000, NOW()),
  ('WEEKLY_TOP_3', 3500, NOW()),
  ('MONTHLY_TOP_1', 20000, NOW()),
  ('MONTHLY_TOP_2', 12500, NOW()),
  ('MONTHLY_TOP_3', 7500, NOW())
ON CONFLICT ("key") DO UPDATE SET
  "value" = EXCLUDED."value",
  "updatedAt" = NOW();

UPDATE "PlayerAchievement"
SET "achievementId" = 'mf_top3_1'
WHERE "achievementId" = 'mf_prize_1'
  AND NOT EXISTS (
    SELECT 1 FROM "PlayerAchievement" pa2
    WHERE pa2."userId" = "PlayerAchievement"."userId"
      AND pa2."achievementId" = 'mf_top3_1'
  );

DELETE FROM "PlayerAchievement"
WHERE "achievementId" IN (
  'win_50', 'ft_25', 'ft_100', 'ft_250',
  'tp_500', 'tp_750', 'tp_1000',
  'aw_52', 'aw_100',
  'ko_500', 'ko_1000',
  'fk_30', 'fk_50', 'fk_100',
  'sf_10', 'rf_5',
  'mf_prize_1', 'mf_win_10'
);

UPDATE "User"
SET "pinnedAchievements" = COALESCE((
  SELECT ARRAY_AGG(pin)
  FROM unnest("pinnedAchievements") AS pin
  WHERE pin NOT IN (
    'win_50', 'ft_25', 'ft_100', 'ft_250',
    'tp_500', 'tp_750', 'tp_1000',
    'aw_52', 'aw_100',
    'ko_500', 'ko_1000',
    'fk_30', 'fk_50', 'fk_100',
    'sf_10', 'rf_5',
    'mf_prize_1', 'mf_win_10'
  )
), '{}');

DELETE FROM "AdminUser"
WHERE email IN ('owner@gutshot.club', 'tvadmin', 'dl', 'admin');

INSERT INTO "AdminUser" ("id", "email", "passwordHash", "name", "role", "createdAt", "updatedAt")
VALUES
  (
    'admin_dealer_dl',
    'dl',
    '$2b$10$PJO4j7pI8e8Jbe0kJbDyvusLa0.dwOXVz7OvdUD9r8lFCLA9uxsiu',
    'Дилер',
    'DEALER',
    NOW(),
    NOW()
  ),
  (
    'admin_owner_admin',
    'admin',
    '$2b$10$RHK03V3PSuGp0ih/D9SCDuH8qycGrWl71xbbHR8aaclMdUo2k2Zu',
    'Админ',
    'OWNER',
    NOW(),
    NOW()
  );
