/**
 * Формула расчета уровня по количеству XP.
 * Точная таблица уровней не зафиксирована в документации проекта —
 * используется прогрессивная формула до момента, когда продукт определит финальные пороги.
 */
export function calculateLevel(xp: number): number {
  if (xp <= 0) {
    return 1;
  }
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

export function xpForLevel(level: number): number {
  return Math.pow(level - 1, 2) * 100;
}

export function calculateLevelProgress(xp: number): {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progress: number;
} {
  const level = calculateLevel(xp);
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const progress = (xp - currentLevelXp) / (nextLevelXp - currentLevelXp);

  return { level, currentLevelXp, nextLevelXp, progress };
}
