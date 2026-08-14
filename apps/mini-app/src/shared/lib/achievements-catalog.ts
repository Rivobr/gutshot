import type {
  AchievementDefinitionDto,
  AchievementGroup,
  AchievementRarity,
  AchievementTextDto,
} from '@gutshot/types';
import { ACHIEVEMENT_GROUP_LABELS } from '@gutshot/types';

export type { AchievementGroup, AchievementRarity };

/** Достижение с прогрессом игрока (каталог приходит с сервера). */
export interface AchievementView extends AchievementDefinitionDto {
  progress: number;
  unlocked: boolean;
}

export const RARITY_STYLE: Record<
  AchievementRarity,
  {
    border: string;
    glow: string;
    accent: string;
    label: string;
    fill: string;
    chip: string;
  }
> = {
  common: {
    border: 'rgba(170,160,140,0.35)',
    glow: 'none',
    accent: '#C6BAA0',
    label: 'Обычное',
    fill: 'linear-gradient(150deg, rgba(150,142,124,0.14), rgba(12,12,12,0.9))',
    chip: 'rgba(170,160,140,0.16)',
  },
  rare: {
    border: 'rgba(74,150,255,0.7)',
    glow: '0 0 26px rgba(74,150,255,0.32)',
    accent: '#6FB4FF',
    label: 'Редкое',
    fill: 'linear-gradient(150deg, rgba(50,120,225,0.26), rgba(9,12,20,0.94))',
    chip: 'rgba(74,150,255,0.22)',
  },
  epic: {
    border: 'rgba(186,85,255,0.75)',
    glow: '0 0 30px rgba(186,85,255,0.36)',
    accent: '#D39BFF',
    label: 'Эпическое',
    fill: 'linear-gradient(150deg, rgba(150,60,220,0.28), rgba(14,9,20,0.94))',
    chip: 'rgba(186,85,255,0.24)',
  },
  legend: {
    border: 'rgba(220,48,48,0.88)',
    glow: '0 0 42px rgba(210,36,36,0.48)',
    accent: '#FF6B6B',
    label: 'Легенда',
    fill: 'linear-gradient(150deg, rgba(180,28,28,0.36), rgba(80,10,10,0.28) 45%, rgba(16,4,4,0.96))',
    chip: 'rgba(220,48,48,0.28)',
  },
};

/** «Легенда Gutshot» всегда золотая, даже при rarity=legend. */
export const LEGEND_GUTSHOT_STYLE = {
  border: 'rgba(255,196,74,0.9)',
  glow: '0 0 42px rgba(255,178,40,0.5)',
  accent: '#FFD873',
  label: 'Легенда Gutshot',
  fill: 'linear-gradient(150deg, rgba(255,178,40,0.34), rgba(120,60,10,0.28) 45%, rgba(16,11,4,0.96))',
  chip: 'rgba(255,196,74,0.28)',
} as const;

export function styleForAchievement(
  id: string | undefined,
  rarity: AchievementRarity,
): (typeof RARITY_STYLE)[AchievementRarity] {
  if (id === 'legend_gutshot') {
    return LEGEND_GUTSHOT_STYLE;
  }
  return RARITY_STYLE[rarity];
}

export const GROUP_ORDER: AchievementGroup[] = [
  'wins',
  'final_tables',
  'tournaments',
  'active_weeks',
  'monthly_final',
  'four_of_a_kind',
  'straight_flush',
  'royal_flush',
  'special',
  'knockouts',
  'legend',
];

export function groupLabel(group: AchievementGroup): string {
  return ACHIEVEMENT_GROUP_LABELS[group] ?? group;
}

/** Группа по id — там, где каталог ещё не загружен (значки в профиле и списке игроков). */
const GROUP_BY_PREFIX: [string, AchievementGroup][] = [
  ['legend_', 'legend'],
  ['win_', 'wins'],
  ['ft_', 'final_tables'],
  ['tp_', 'tournaments'],
  ['aw_', 'active_weeks'],
  ['wr_', 'weekly_rating'],
  ['mf_', 'monthly_final'],
  ['fk_', 'four_of_a_kind'],
  ['sf_', 'straight_flush'],
  ['rf_', 'royal_flush'],
  ['sp_', 'special'],
  ['ko_', 'knockouts'],
];

export function groupFromAchievementId(id: string): AchievementGroup | undefined {
  return GROUP_BY_PREFIX.find(([prefix]) => id.startsWith(prefix))?.[1];
}

/** Подставляет тексты из админки поверх каталога и добавляет прогресс игрока. */
export function buildAchievementViews(
  catalog: AchievementDefinitionDto[] | undefined,
  texts: AchievementTextDto[] | undefined,
  progressMap: Record<string, number> | undefined,
  unlockedIds: string[] | undefined,
): AchievementView[] {
  if (!catalog?.length) {
    return [];
  }

  const textById = new Map((texts ?? []).map((item) => [item.id, item]));
  const unlocked = new Set(unlockedIds ?? []);

  return catalog.map((definition) => {
    const override = textById.get(definition.id);
    const progress = progressMap?.[definition.id] ?? 0;

    return {
      ...definition,
      icon: override?.icon || definition.icon,
      title: override?.title || definition.title,
      description: override?.description || definition.description,
      howTo: override?.howTo || definition.howTo,
      progress,
      unlocked: unlocked.has(definition.id) || progress >= definition.target,
    };
  });
}

/** Достижения по группам в порядке постера клуба. */
export function groupAchievements(
  views: AchievementView[],
): { group: AchievementGroup; label: string; items: AchievementView[] }[] {
  return GROUP_ORDER.map((group) => ({
    group,
    label: groupLabel(group),
    items: views.filter((item) => item.group === group),
  })).filter((section) => section.items.length > 0);
}

/** Внутри группы: сначала открытые, затем ближайшие к получению. */
export function sortAchievementsByAvailability(views: AchievementView[]): AchievementView[] {
  return [...views].sort((a, b) => {
    if (a.unlocked !== b.unlocked) {
      return a.unlocked ? -1 : 1;
    }
    const aRatio = a.target > 0 ? a.progress / a.target : 0;
    const bRatio = b.target > 0 ? b.progress / b.target : 0;
    if (aRatio !== bRatio) {
      return bRatio - aRatio;
    }
    return a.target - b.target;
  });
}
