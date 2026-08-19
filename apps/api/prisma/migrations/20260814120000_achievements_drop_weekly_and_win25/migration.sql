-- Drop weekly-rating achievements and win_25. Keep already awarded XP.
-- Retarget ft_5 copy to «3 финальных стола».

DELETE FROM "PlayerAchievement"
WHERE "achievementId" IN (
  'win_25',
  'wr_top3_1', 'wr_top3_3', 'wr_top3_5', 'wr_top3_10',
  'wr_win_1', 'wr_win_3', 'wr_win_5', 'wr_win_10'
);

UPDATE "User"
SET "pinnedAchievements" = COALESCE((
  SELECT ARRAY_AGG(pin)
  FROM unnest("pinnedAchievements") AS pin
  WHERE pin NOT IN (
    'win_25',
    'wr_top3_1', 'wr_top3_3', 'wr_top3_5', 'wr_top3_10',
    'wr_win_1', 'wr_win_3', 'wr_win_5', 'wr_win_10'
  )
), '{}');

DELETE FROM "AchievementText"
WHERE "id" IN (
  'win_25',
  'wr_top3_1', 'wr_top3_3', 'wr_top3_5', 'wr_top3_10',
  'wr_win_1', 'wr_win_3', 'wr_win_5', 'wr_win_10'
);

UPDATE "AchievementText"
SET
  "title" = '3 финальных стола',
  "description" = 'Три финалки',
  "howTo" = 'Три раза попадите в топ-9.',
  "updatedAt" = NOW()
WHERE "id" = 'ft_5';
