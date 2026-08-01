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
    howTo:
      '1) Откройте «Турниры» и запишитесь на ближайший. 2) Придите в клуб ко времени старта. 3) Покажите свой QR администратору — он отметит явку. 4) После завершения турнира участие засчитается.',
    target: 1,
    getProgress: (ctx) => Math.min(ctx.tournamentsPlayed, 1),
  },
  {
    id: 'regular',
    icon: '📅',
    title: 'Постоянный гость',
    description: 'Сыграйте 5 турниров.',
    howTo:
      'Запишитесь и сыграйте 5 разных турниров GUTSHOT. Каждый раз: регистрация в приложении → явка по QR у администратора → финиш турнира. Прогресс: число сыгранных турниров.',
    target: 5,
    getProgress: (ctx) => Math.min(ctx.tournamentsPlayed, 5),
  },
  {
    id: 'first_itm',
    icon: '🎖',
    title: 'В призах',
    description: 'Попадите в призовую зону (ITM) хотя бы раз.',
    howTo:
      'Сыграйте турнир до конца и займите место в топ-10. После финиша администратор вносит места — тогда ITM засчитывается автоматически. Недостаточно просто записаться: нужно закончить турнир в призах.',
    target: 1,
    getProgress: (ctx) => Math.min(ctx.itm, 1),
  },
  {
    id: 'first_win',
    icon: '🏆',
    title: 'Первая победа',
    description: 'Выиграйте турнир — займите 1 место.',
    howTo:
      'Запишитесь на турнир, придите и сыграйте. Нужно остаться последним игроком за столом (1 место). Когда администратор завершит турнир и укажет ваше место «1», достижение откроется, начислятся очки рейтинга.',
    target: 1,
    getProgress: (ctx) => Math.min(ctx.wins, 1),
  },
  {
    id: 'three_wins',
    icon: '👑',
    title: 'Серия побед',
    description: 'Три победы в турнирах клуба.',
    howTo:
      'Выиграйте три турнира (три раза займите 1 место). Победы копятся за всё время — не обязательно подряд. Каждая победа фиксируется при завершении турнира администратором.',
    target: 3,
    getProgress: (ctx) => Math.min(ctx.wins, 3),
  },
  {
    id: 'bounty_hunter',
    icon: '💀',
    title: 'Охотник за баунти',
    description: 'Сделайте 5 нокаутов (баунти) в турнирах.',
    howTo:
      'Во время игры выбейте соперника из турнира. Сразу после нокаута покажите администратору свой QR — он нажмёт событие «Баунти». Нужно 5 таких отметок. Сам по себе вылет соперника без отметки админа не засчитывается.',
    target: 5,
    getProgress: (ctx) => Math.min(ctx.bounties, 5),
  },
  {
    id: 'club_week',
    icon: '📍',
    title: 'Неделя в клубе',
    description: 'Будьте с клубом не меньше 7 дней.',
    howTo:
      'Отсчёт идёт с дня первой регистрации в мини-приложении. Заходите в приложение и участвуйте в жизни клуба — через 7 календарных дней достижение откроется само. Отдельно ничего подтверждать не нужно.',
    target: 7,
    getProgress: (ctx) => Math.min(ctx.daysInClub, 7),
  },
  {
    id: 'four_kind',
    icon: '🃏',
    title: 'Каре',
    description: 'Соберите каре (четыре карты одного достоинства) за живым столом.',
    howTo:
      'За столом соберите комбинацию «каре». Не сбрасывайте карты сразу — позовите администратора, покажите руку и свой QR. Админ отметит событие «Каре». Без показа руки и отметки достижение не откроется.',
    target: 1,
    code: 'FOUR_OF_A_KIND',
    getProgress: (ctx) => (ctx.unlockedCodes.has('FOUR_OF_A_KIND') ? 1 : 0),
  },
  {
    id: 'straight_flush',
    icon: '🔥',
    title: 'Стрит-флеш',
    description: 'Соберите стрит-флеш за живым столом.',
    howTo:
      'Соберите пять карт одной масти подряд (стрит-флеш). Позовите администратора, покажите карты и QR. Админ отметит «Стрит-флеш». Комбинация должна быть подтверждена в момент раздачи, а не постфактум без карт.',
    target: 1,
    code: 'STRAIGHT_FLUSH',
    getProgress: (ctx) => (ctx.unlockedCodes.has('STRAIGHT_FLUSH') ? 1 : 0),
  },
  {
    id: 'royal_flush',
    icon: '💎',
    title: 'Роял-флеш',
    description: 'Соберите роял-флеш — самую редкую комбинацию.',
    howTo:
      'Соберите Т–В–Д–К–Т одной масти. Немедленно позовите администратора, покажите руку и QR. Админ отметит «Роял-флеш». Это разовое достижение — достаточно одного подтверждённого случая.',
    target: 1,
    code: 'ROYAL_FLUSH',
    getProgress: (ctx) => (ctx.unlockedCodes.has('ROYAL_FLUSH') ? 1 : 0),
  },
];
