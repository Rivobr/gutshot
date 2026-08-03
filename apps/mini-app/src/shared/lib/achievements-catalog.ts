import type { AchievementCode, AchievementTextDto } from '@gutshot/types';

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legend';

export interface AchievementDef {
  id: string;
  icon: string;
  title: string;
  description: string;
  howTo: string;
  /** XP за достижение (как на постере клуба) */
  xp: number;
  /** Цель для прогресса; 1 = бинарное */
  target: number;
  rarity: AchievementRarity;
  /** Занимает две клетки сетки */
  span2?: boolean;
  getProgress: (ctx: AchievementContext) => number;
  code?: AchievementCode;
}

export interface AchievementContext {
  visits: number;
  wins: number;
  finalTables: number;
  winStreak: number;
  bounties: number;
  fourOfAKind: number;
  unlockedCodes: Set<string>;
}

export const RARITY_STYLE: Record<
  AchievementRarity,
  { border: string; glow: string; accent: string; label: string }
> = {
  common: {
    border: 'rgba(160,150,130,0.28)',
    glow: 'none',
    accent: '#B6A98F',
    label: 'Обычное',
  },
  rare: {
    border: 'rgba(80,140,220,0.45)',
    glow: '0 0 18px rgba(80,140,220,0.18)',
    accent: '#7EB6F0',
    label: 'Редкое',
  },
  epic: {
    border: 'rgba(180,90,220,0.45)',
    glow: '0 0 20px rgba(180,90,220,0.2)',
    accent: '#C79BEC',
    label: 'Эпическое',
  },
  legend: {
    border: 'rgba(247,217,138,0.55)',
    glow: '0 0 28px rgba(199,154,61,0.28)',
    accent: '#F7D98A',
    label: 'Легенда',
  },
};

/**
 * Каталог как на постере «Система достижений».
 * Логика прогресса в коде; тексты можно переопределить из админки.
 */
export const ACHIEVEMENTS_CATALOG: AchievementDef[] = [
  {
    id: 'first_visit',
    icon: '🚪',
    title: 'Первый визит',
    description: 'Приди в клуб',
    howTo:
      'Запишитесь на турнир, придите в клуб и покажите QR администратору. Когда отметят явку — достижение откроется.',
    xp: 100,
    target: 1,
    rarity: 'common',
    getProgress: (ctx) => Math.min(ctx.visits, 1),
  },
  {
    id: 'visit_5',
    icon: '5️⃣',
    title: 'Посети клуб',
    description: '5 раз',
    howTo: 'Нужно 5 отметок явки по QR у администратора на турнирах GUTSHOT.',
    xp: 250,
    target: 5,
    rarity: 'common',
    getProgress: (ctx) => Math.min(ctx.visits, 5),
  },
  {
    id: 'four_kind',
    icon: '🃏',
    title: 'Каре',
    description: 'Собери каре в раздаче',
    howTo:
      'Соберите каре за столом, покажите карты и QR администратору — он отметит событие «Каре».',
    xp: 300,
    target: 1,
    rarity: 'rare',
    code: 'FOUR_OF_A_KIND',
    getProgress: (ctx) => Math.min(ctx.fourOfAKind, 1),
  },
  {
    id: 'four_kind_5',
    icon: '🃏',
    title: 'Каре ×5',
    description: 'Собери каре 5 раз',
    howTo: 'Пять отметок события «Каре» у администратора.',
    xp: 750,
    target: 5,
    rarity: 'epic',
    code: 'FOUR_OF_A_KIND',
    getProgress: (ctx) => Math.min(ctx.fourOfAKind, 5),
  },
  {
    id: 'first_knockout',
    icon: '🎯',
    title: 'Первый нокаут',
    description: 'Выбей соперника из турнира',
    howTo: 'Выбейте игрока из турнира и сразу покажите QR администратору — событие «Баунти».',
    xp: 200,
    target: 1,
    rarity: 'common',
    getProgress: (ctx) => Math.min(ctx.bounties, 1),
  },
  {
    id: 'royal_flush',
    icon: '💎',
    title: 'Флеш-рояль',
    description: 'Собери флеш-рояль в любой раздаче',
    howTo: 'Соберите Т–В–Д–К–Т одной масти, покажите руку и QR — админ отметит «Роял-флеш».',
    xp: 1000,
    target: 1,
    rarity: 'epic',
    code: 'ROYAL_FLUSH',
    getProgress: (ctx) => (ctx.unlockedCodes.has('ROYAL_FLUSH') ? 1 : 0),
  },
  {
    id: 'visit_10',
    icon: '🔟',
    title: 'Посети клуб',
    description: '10 раз',
    howTo: 'Нужно 10 отметок явки по QR у администратора.',
    xp: 500,
    target: 10,
    rarity: 'rare',
    getProgress: (ctx) => Math.min(ctx.visits, 10),
  },
  {
    id: 'first_win',
    icon: '🏆',
    title: 'Первая победа',
    description: 'Выиграй турнир',
    howTo:
      'Займите 1 место. Когда администратор завершит турнир и укажет ваше место — достижение откроется.',
    xp: 500,
    target: 1,
    rarity: 'rare',
    getProgress: (ctx) => Math.min(ctx.wins, 1),
  },
  {
    id: 'straight_flush',
    icon: '🔥',
    title: 'Стрит-флеш',
    description: 'Собери стрит-флеш в любой раздаче',
    howTo: 'Соберите стрит-флеш, покажите карты и QR — админ отметит «Стрит-флеш».',
    xp: 750,
    target: 1,
    rarity: 'epic',
    code: 'STRAIGHT_FLUSH',
    getProgress: (ctx) => (ctx.unlockedCodes.has('STRAIGHT_FLUSH') ? 1 : 0),
  },
  {
    id: 'final_table',
    icon: '🪙',
    title: 'Финальный стол',
    description: 'Попади за финальный стол',
    howTo: 'Закончите турнир в топ-9. Место вносит администратор при завершении турнира.',
    xp: 1000,
    target: 1,
    rarity: 'epic',
    getProgress: (ctx) => Math.min(ctx.finalTables, 1),
  },
  {
    id: 'win_streak',
    icon: '⭐',
    title: 'Серия побед',
    description: 'Выиграй 3 турнира подряд',
    howTo: 'Три раза подряд займите 1 место в турнирах клуба (по порядку дат турниров).',
    xp: 750,
    target: 3,
    rarity: 'rare',
    getProgress: (ctx) => Math.min(ctx.winStreak, 3),
  },
  {
    id: 'legend_gutshot',
    icon: '👑',
    title: 'Легенда Гатшот',
    description: 'Элита клуба: победы, финалы и преданность залу',
    howTo:
      'Нужны: минимум 1 победа, 1 финальный стол и 10 визитов. Статус легенды выделяется в сетке.',
    xp: 2000,
    target: 3,
    rarity: 'legend',
    span2: true,
    getProgress: (ctx) =>
      (ctx.wins >= 1 ? 1 : 0) + (ctx.finalTables >= 1 ? 1 : 0) + (ctx.visits >= 10 ? 1 : 0),
  },
];

/** Сортировка: сначала открытые, потом закрытые; легенда ближе к верху среди открытых. */
export function sortAchievementsByAvailability(
  items: AchievementDef[],
  ctx: AchievementContext,
): AchievementDef[] {
  return [...items].sort((a, b) => {
    const aDone = a.getProgress(ctx) >= a.target ? 1 : 0;
    const bDone = b.getProgress(ctx) >= b.target ? 1 : 0;
    if (aDone !== bDone) return bDone - aDone;
    if (Boolean(a.span2) !== Boolean(b.span2)) return a.span2 ? -1 : 1;
    return 0;
  });
}

/** Подставляет тексты из админки поверх каталога (логика прогресса не меняется). */
export function mergeAchievementTexts(texts?: AchievementTextDto[] | null): AchievementDef[] {
  if (!texts?.length) {
    return ACHIEVEMENTS_CATALOG;
  }

  const byId = new Map<string, AchievementTextDto>(texts.map((item) => [item.id, item]));
  return ACHIEVEMENTS_CATALOG.map((item) => {
    const override = byId.get(item.id);
    if (!override) {
      return item;
    }
    return {
      ...item,
      icon: override.icon || item.icon,
      title: override.title,
      description: override.description,
      howTo: override.howTo,
    };
  });
}
