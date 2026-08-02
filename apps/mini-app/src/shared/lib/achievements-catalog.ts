import type { AchievementCode, AchievementTextDto } from '@gutshot/types';

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
  getProgress: (ctx: AchievementContext) => number;
  code?: AchievementCode;
}

export interface AchievementContext {
  visits: number;
  wins: number;
  finalTables: number;
  winStreak: number;
  bounties: number;
  unlockedCodes: Set<string>;
}

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
    getProgress: (ctx) => Math.min(ctx.visits, 5),
  },
  {
    id: 'four_kind',
    icon: '🃏',
    title: 'Каре',
    description: 'Собери каре в любой раздаче',
    howTo:
      'Соберите каре за столом, покажите карты и QR администратору — он отметит событие «Каре».',
    xp: 300,
    target: 1,
    code: 'FOUR_OF_A_KIND',
    getProgress: (ctx) => (ctx.unlockedCodes.has('FOUR_OF_A_KIND') ? 1 : 0),
  },
  {
    id: 'first_knockout',
    icon: '🎯',
    title: 'Первый нокаут',
    description: 'Выбей соперника из турнира',
    howTo:
      'Выбейте игрока из турнира и сразу покажите QR администратору — событие «Баунти».',
    xp: 200,
    target: 1,
    getProgress: (ctx) => Math.min(ctx.bounties, 1),
  },
  {
    id: 'royal_flush',
    icon: '💎',
    title: 'Флеш-рояль',
    description: 'Собери флеш-рояль в любой раздаче',
    howTo:
      'Соберите Т–В–Д–К–Т одной масти, покажите руку и QR — админ отметит «Роял-флеш».',
    xp: 1000,
    target: 1,
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
    getProgress: (ctx) => Math.min(ctx.wins, 1),
  },
  {
    id: 'straight_flush',
    icon: '🔥',
    title: 'Стрит-флеш',
    description: 'Собери стрит-флеш в любой раздаче',
    howTo:
      'Соберите стрит-флеш, покажите карты и QR — админ отметит «Стрит-флеш».',
    xp: 750,
    target: 1,
    code: 'STRAIGHT_FLUSH',
    getProgress: (ctx) => (ctx.unlockedCodes.has('STRAIGHT_FLUSH') ? 1 : 0),
  },
  {
    id: 'final_table',
    icon: '🪙',
    title: 'Финальный стол',
    description: 'Попади за финальный стол',
    howTo:
      'Закончите турнир в топ-9. Место вносит администратор при завершении турнира.',
    xp: 1000,
    target: 1,
    getProgress: (ctx) => Math.min(ctx.finalTables, 1),
  },
  {
    id: 'win_streak',
    icon: '⭐',
    title: 'Серия побед',
    description: 'Выиграй 3 турнира подряд',
    howTo:
      'Три раза подряд займите 1 место в турнирах клуба (по порядку дат турниров).',
    xp: 750,
    target: 3,
    getProgress: (ctx) => Math.min(ctx.winStreak, 3),
  },
];

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
