import {
  ACHIEVEMENTS_BY_ID,
  type AchievementGroup,
  type AchievementRarity,
} from '../constants/achievements-catalog';

/** Витринное достижение для списков игроков (рейтинг, турнир). */
export interface ShowcaseAchievementDto {
  id: string;
  group: AchievementGroup;
  rarity: AchievementRarity;
  title: string;
  icon: string;
}

const RARITY_RANK: Record<AchievementRarity, number> = {
  common: 1,
  rare: 2,
  epic: 3,
  legend: 4,
};

const MAX_SHOWCASE = 3;

function toShowcase(id: string): ShowcaseAchievementDto | null {
  const def = ACHIEVEMENTS_BY_ID.get(id);
  if (!def) return null;
  return {
    id: def.id,
    group: def.group,
    rarity: def.rarity,
    title: def.title,
    icon: def.icon,
  };
}

/**
 * Витрина: закреплённые игроком, иначе топ открытых по редкости.
 */
export function buildShowcaseAchievements(
  pinnedIds: string[] | null | undefined,
  unlockedIds: string[] | null | undefined,
  limit = MAX_SHOWCASE,
): ShowcaseAchievementDto[] {
  const pinned = (pinnedIds ?? [])
    .map(toShowcase)
    .filter((item): item is ShowcaseAchievementDto => item != null)
    .slice(0, limit);

  if (pinned.length > 0) {
    return pinned;
  }

  return (unlockedIds ?? [])
    .map(toShowcase)
    .filter((item): item is ShowcaseAchievementDto => item != null)
    .sort((a, b) => RARITY_RANK[b.rarity] - RARITY_RANK[a.rarity] || a.id.localeCompare(b.id))
    .slice(0, limit);
}
