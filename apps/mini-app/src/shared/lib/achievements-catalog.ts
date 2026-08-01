import type { AchievementCode } from '@gutshot/types';

export interface AchievementDef {
  id: string;
  icon: string;
  title: string;
  description: string;
  howTo: string;
  /** Цель для прогресса; 1 = бинарное */
  target: number;
  getProgress: (ctx: AchievementContext) => number;
  code?: AchievementCode;
}

export interface AchievementContext {
  tournamentsPlayed: number;
  wins: number;
  itm: number;
  firstPlaces: number;
  bounties: number;
  daysInClub: number;
  unlockedCodes: Set<string>;
}

export const ACHIEVEMENTS_CATALOG: AchievementDef[] = [
  {
    id: 'first_game',
    icon: '🃏',
    title: 'Первая игра',
    description: 'Сыграйте свой первый турнир в клубе.',
    howTo: 'Запишитесь на турнир и отметьтесь у администратора по QR-коду.',
    target: 1,
    getProgress: (ctx) => Math.min(ctx.tournamentsPlayed, 1),
  },
  {
    id: 'regular',
    icon: '📅',
    title: 'Постоянный гость',
    description: 'Сыграйте 5 турниров.',
    howTo: 'Участвуйте в регулярных турнирах клуба.',
    target: 5,
    getProgress: (ctx) => Math.min(ctx.tournamentsPlayed, 5),
  },
  {
    id: 'first_itm',
    icon: '🎖',
    title: 'В призах',
    description: 'Попадите в призовую зону (ITM) хотя бы раз.',
    howTo: 'Займите место в топ-10 турнира — администратор зафиксирует результат.',
    target: 1,
    getProgress: (ctx) => Math.min(ctx.itm, 1),
  },
  {
    id: 'first_win',
    icon: '🏆',
    title: 'Первая победа',
    description: 'Выиграйте турнир.',
    howTo: 'Займите 1 место — очки рейтинга и XP начислятся после завершения турнира.',
    target: 1,
    getProgress: (ctx) => Math.min(ctx.wins, 1),
  },
  {
    id: 'three_wins',
    icon: '👑',
    title: 'Серия побед',
    description: 'Три победы в турнирах клуба.',
    howTo: 'Продолжайте побеждать в турнирах GUTSHOT.',
    target: 3,
    getProgress: (ctx) => Math.min(ctx.wins, 3),
  },
  {
    id: 'bounty_hunter',
    icon: '💀',
    title: 'Охотник за баунти',
    description: 'Сделайте 5 нокаутов (баунти).',
    howTo: 'Администратор отмечает баунти по вашему QR во время турнира.',
    target: 5,
    getProgress: (ctx) => Math.min(ctx.bounties, 5),
  },
  {
    id: 'club_week',
    icon: '📍',
    title: 'Неделя в клубе',
    description: 'Будьте с клубом не меньше 7 дней.',
    howTo: 'Просто зайдите в приложение — дни считаются с первой регистрации.',
    target: 7,
    getProgress: (ctx) => Math.min(ctx.daysInClub, 7),
  },
  {
    id: 'four_kind',
    icon: '🃏',
    title: 'Каре',
    description: 'Соберите каре за столом.',
    howTo: 'Покажите руку администратору — он отметит комбо по QR.',
    target: 1,
    code: 'FOUR_OF_A_KIND',
    getProgress: (ctx) => (ctx.unlockedCodes.has('FOUR_OF_A_KIND') ? 1 : 0),
  },
  {
    id: 'straight_flush',
    icon: '🔥',
    title: 'Стрит-флеш',
    description: 'Соберите стрит-флеш.',
    howTo: 'Покажите руку администратору — он отметит комбо по QR.',
    target: 1,
    code: 'STRAIGHT_FLUSH',
    getProgress: (ctx) => (ctx.unlockedCodes.has('STRAIGHT_FLUSH') ? 1 : 0),
  },
  {
    id: 'royal_flush',
    icon: '💎',
    title: 'Роял-флеш',
    description: 'Соберите роял-флеш — редчайшая комбинация.',
    howTo: 'Покажите руку администратору — он отметит комбо по QR.',
    target: 1,
    code: 'ROYAL_FLUSH',
    getProgress: (ctx) => (ctx.unlockedCodes.has('ROYAL_FLUSH') ? 1 : 0),
  },
];
