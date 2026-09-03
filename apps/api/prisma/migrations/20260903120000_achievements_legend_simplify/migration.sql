-- Удаление достижений v3: mf_win_3, mf_win_5, sp_win_no_reentry, sp_short_stack, sp_win_streak_3.
-- Каталог сокращён, условия «Легенды Gutshot» упрощены (финал месяца, победы, финалки, нокауты).

DELETE FROM "PlayerAchievement"
WHERE "achievementId" IN (
  'mf_win_3', 'mf_win_5',
  'sp_win_no_reentry', 'sp_short_stack', 'sp_win_streak_3'
);

UPDATE "User"
SET "pinnedAchievements" = COALESCE((
  SELECT ARRAY_AGG(pin)
  FROM unnest("pinnedAchievements") AS pin
  WHERE pin NOT IN (
    'mf_win_3', 'mf_win_5',
    'sp_win_no_reentry', 'sp_short_stack', 'sp_win_streak_3'
  )
), '{}');

DELETE FROM "AchievementText"
WHERE "id" IN (
  'mf_win_3', 'mf_win_5',
  'sp_win_no_reentry', 'sp_short_stack', 'sp_win_streak_3'
);
