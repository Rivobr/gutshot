/**
 * Каталог достижений Gutshot (модель 600k XP / 100 ур.).
 * Единый источник правды: сервер начисляет XP, Mini App рисует прогресс.
 */

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legend';

export type AchievementGroup =
  | 'wins'
  | 'final_tables'
  | 'tournaments'
  | 'active_weeks'
  | 'weekly_rating'
  | 'monthly_final'
  | 'four_of_a_kind'
  | 'straight_flush'
  | 'royal_flush'
  | 'special'
  | 'knockouts'
  | 'legend';

/** Метрики игрока, по которым считается прогресс достижений. */
export interface AchievementMetrics {
  wins: number;
  finalTables: number;
  tournamentsPlayed: number;
  activeWeeks: number;
  weeklyTop3: number;
  weeklyWins: number;
  monthlyEntries: number;
  monthlyPrizes: number;
  monthlyWins: number;
  fourOfAKind: number;
  straightFlush: number;
  royalFlush: number;
  knockouts: number;
  level: number;
  winNoReentry: number;
  /** Максимальная серия побед подряд. */
  backToBackWins: number;
  finalTableStreak: number;
  top10Streak: number;
  shortStackWins: number;
  tutorialCompleted: number;
  friendsReferred: number;
}

export type AchievementMetric = keyof AchievementMetrics;

export interface AchievementDefinition {
  id: string;
  group: AchievementGroup;
  icon: string;
  title: string;
  description: string;
  howTo: string;
  xp: number;
  target: number;
  metric: AchievementMetric;
  rarity: AchievementRarity;
  span2?: boolean;
  requires?: Partial<Record<AchievementMetric, number>>;
}

function tier(
  id: string,
  group: AchievementGroup,
  metric: AchievementMetric,
  icon: string,
  title: string,
  description: string,
  howTo: string,
  target: number,
  xp: number,
  rarity: AchievementRarity,
): AchievementDefinition {
  return { id, group, metric, icon, title, description, howTo, target, xp, rarity };
}

export const ACHIEVEMENTS_CATALOG: AchievementDefinition[] = [
  // 🏆 Победы
  tier(
    'win_1',
    'wins',
    'wins',
    '🏆',
    'Первая победа',
    'Выиграй турнир',
    'Займите 1 место в любом турнире клуба.',
    1,
    2500,
    'rare',
  ),
  tier(
    'win_3',
    'wins',
    'wins',
    '🏆',
    '3 победы',
    'Выиграй 3 турнира',
    'Три первых места в турнирах клуба.',
    3,
    4000,
    'epic',
  ),
  tier(
    'win_5',
    'wins',
    'wins',
    '🏆',
    '5 побед',
    'Выиграй 5 турниров',
    'Пять первых мест в турнирах клуба.',
    5,
    6000,
    'rare',
  ),
  tier(
    'win_10',
    'wins',
    'wins',
    '🏆',
    '10 побед',
    'Выиграй 10 турниров',
    'Десять первых мест в турнирах клуба.',
    10,
    10000,
    'epic',
  ),
  tier(
    'win_15',
    'wins',
    'wins',
    '🏆',
    '15 побед',
    'Выиграй 15 турниров',
    'Пятнадцать первых мест в турнирах клуба.',
    15,
    15000,
    'epic',
  ),

  // 🎯 Финальные столы
  tier(
    'ft_1',
    'final_tables',
    'finalTables',
    '🎯',
    'Первый финальный стол',
    'Дойди до финального стола',
    'Займите место в топ-9 турнира.',
    1,
    1000,
    'common',
  ),
  tier(
    'ft_5',
    'final_tables',
    'finalTables',
    '🎯',
    '3 финальных стола',
    'Три финалки',
    'Три раза попадите в топ-9.',
    3,
    2000,
    'rare',
  ),
  tier(
    'ft_10',
    'final_tables',
    'finalTables',
    '🎯',
    '10 финальных столов',
    'Десять финалок',
    'Десять раз в топ-9.',
    10,
    4000,
    'rare',
  ),
  tier(
    'ft_20',
    'final_tables',
    'finalTables',
    '🎯',
    '20 финальных столов',
    'Двадцать финалок',
    'Двадцать раз в топ-9.',
    20,
    7000,
    'rare',
  ),
  tier(
    'ft_30',
    'final_tables',
    'finalTables',
    '🎯',
    '30 финальных столов',
    'Тридцать финалок',
    'Тридцать раз в топ-9.',
    30,
    11000,
    'epic',
  ),
  tier(
    'ft_50',
    'final_tables',
    'finalTables',
    '🎯',
    '50 финальных столов',
    'Пятьдесят финалок',
    'Пятьдесят раз в топ-9.',
    50,
    20000,
    'legend',
  ),

  // 🎮 Сыгранные турниры
  tier(
    'tp_1',
    'tournaments',
    'tournamentsPlayed',
    '🎮',
    '1 турнир',
    'Сыграй первый турнир',
    'Завершите свой первый турнир в клубе.',
    1,
    250,
    'common',
  ),
  tier(
    'tp_5',
    'tournaments',
    'tournamentsPlayed',
    '🎮',
    '5 турниров',
    'Сыграй 5 турниров',
    'Пять завершённых турниров.',
    5,
    500,
    'common',
  ),
  tier(
    'tp_10',
    'tournaments',
    'tournamentsPlayed',
    '🎮',
    '10 турниров',
    'Сыграй 10 турниров',
    'Десять завершённых турниров.',
    10,
    750,
    'common',
  ),
  tier(
    'tp_15',
    'tournaments',
    'tournamentsPlayed',
    '🎮',
    '15 турниров',
    'Сыграй 15 турниров',
    'Пятнадцать завершённых турниров.',
    15,
    1000,
    'common',
  ),
  tier(
    'tp_25',
    'tournaments',
    'tournamentsPlayed',
    '🎮',
    '25 турниров',
    'Сыграй 25 турниров',
    'Двадцать пять завершённых турниров.',
    25,
    1500,
    'common',
  ),
  tier(
    'tp_35',
    'tournaments',
    'tournamentsPlayed',
    '🎮',
    '35 турниров',
    'Сыграй 35 турниров',
    'Тридцать пять завершённых турниров.',
    35,
    2500,
    'rare',
  ),
  tier(
    'tp_50',
    'tournaments',
    'tournamentsPlayed',
    '🎮',
    '50 турниров',
    'Сыграй 50 турниров',
    'Пятьдесят завершённых турниров.',
    50,
    4000,
    'rare',
  ),
  tier(
    'tp_60',
    'tournaments',
    'tournamentsPlayed',
    '🎮',
    '60 турниров',
    'Сыграй 60 турниров',
    'Шестьдесят завершённых турниров.',
    60,
    6000,
    'epic',
  ),
  tier(
    'tp_75',
    'tournaments',
    'tournamentsPlayed',
    '🎮',
    '75 турниров',
    'Сыграй 75 турниров',
    'Семьдесят пять — очень активный год.',
    75,
    10000,
    'legend',
  ),
  tier(
    'tp_100',
    'tournaments',
    'tournamentsPlayed',
    '🎮',
    '100 турниров',
    'Сыграй 100 турниров',
    'Сто турниров — исключительный показатель.',
    100,
    20000,
    'legend',
  ),

  // 🔥 Активные недели (3+ турнира)
  tier(
    'aw_3',
    'active_weeks',
    'activeWeeks',
    '🔥',
    '3 активные недели',
    'Три активные недели',
    'Неделя активна, если сыграно минимум 3 турнира.',
    3,
    750,
    'common',
  ),
  tier(
    'aw_5',
    'active_weeks',
    'activeWeeks',
    '🔥',
    '5 активных недель',
    'Пять активных недель',
    'Пять недель с 3+ турнирами.',
    5,
    1250,
    'common',
  ),
  tier(
    'aw_10',
    'active_weeks',
    'activeWeeks',
    '🔥',
    '10 активных недель',
    'Десять активных недель',
    'Десять недель с 3+ турнирами.',
    10,
    2500,
    'rare',
  ),
  tier(
    'aw_15',
    'active_weeks',
    'activeWeeks',
    '🔥',
    '15 активных недель',
    'Пятнадцать активных недель',
    'Пятнадцать недель с 3+ турнирами.',
    15,
    4000,
    'rare',
  ),
  tier(
    'aw_20',
    'active_weeks',
    'activeWeeks',
    '🔥',
    '20 активных недель',
    'Двадцать активных недель',
    'Двадцать недель с 3+ турнирами.',
    20,
    6000,
    'epic',
  ),
  tier(
    'aw_25',
    'active_weeks',
    'activeWeeks',
    '🔥',
    '25 активных недель',
    'Двадцать пять активных недель',
    'Двадцать пять недель с 3+ турнирами.',
    25,
    10000,
    'legend',
  ),

  // 💀 Нокауты
  tier(
    'ko_1',
    'knockouts',
    'knockouts',
    '💀',
    'Первый KO',
    'Выбей соперника',
    'Админ отметит баунти / нокаут.',
    1,
    300,
    'common',
  ),
  tier(
    'ko_5',
    'knockouts',
    'knockouts',
    '💀',
    '5 KO',
    'Пять нокаутов',
    'Пять отметок баунти.',
    5,
    750,
    'common',
  ),
  tier(
    'ko_10',
    'knockouts',
    'knockouts',
    '💀',
    '10 KO',
    'Десять нокаутов',
    'Десять отметок баунти.',
    10,
    1250,
    'common',
  ),
  tier(
    'ko_25',
    'knockouts',
    'knockouts',
    '💀',
    '25 KO',
    'Двадцать пять нокаутов',
    'Двадцать пять отметок баунти.',
    25,
    2500,
    'rare',
  ),
  tier(
    'ko_50',
    'knockouts',
    'knockouts',
    '💀',
    '50 KO',
    'Пятьдесят нокаутов',
    'Пятьдесят отметок баунти.',
    50,
    4000,
    'rare',
  ),
  tier(
    'ko_100',
    'knockouts',
    'knockouts',
    '💀',
    '100 KO',
    'Сто нокаутов',
    'Сто отметок баунти.',
    100,
    7500,
    'epic',
  ),
  tier(
    'ko_150',
    'knockouts',
    'knockouts',
    '💀',
    '150 KO',
    'Сто пятьдесят нокаутов',
    'Сто пятьдесят отметок баунти.',
    150,
    10000,
    'epic',
  ),
  tier(
    'ko_250',
    'knockouts',
    'knockouts',
    '💀',
    '250 KO',
    'Двести пятьдесят нокаутов',
    'Двести пятьдесят отметок баунти.',
    250,
    17500,
    'legend',
  ),

  // 👑 Финал месяца (накопительные)
  tier(
    'mf_entry_1',
    'monthly_final',
    'monthlyEntries',
    '👑',
    'Первое участие',
    'Участие в финале месяца',
    'Попадите в розыгрыш / выплату финала месяца.',
    1,
    1500,
    'rare',
  ),
  tier(
    'mf_top3_1',
    'monthly_final',
    'monthlyPrizes',
    '👑',
    'Первый топ-3 месяца',
    'Топ-3 финала месяца',
    'Займите 1–3 место в финале месяца.',
    1,
    4000,
    'epic',
  ),
  tier(
    'mf_win_1',
    'monthly_final',
    'monthlyWins',
    '👑',
    'Первая победа месяца',
    'Победа в финале месяца',
    'Займите 1 место в финале месяца.',
    1,
    7500,
    'legend',
  ),
  tier(
    'mf_win_3',
    'monthly_final',
    'monthlyWins',
    '👑',
    '3 победы месяца',
    'Три победы финала месяца',
    'Три первых места в финале месяца.',
    3,
    20000,
    'legend',
  ),
  tier(
    'mf_win_5',
    'monthly_final',
    'monthlyWins',
    '👑',
    '5 побед месяца',
    'Пять побед финала месяца',
    'Пять первых мест в финале месяца.',
    5,
    35000,
    'legend',
  ),

  // 🃏 Каре
  tier(
    'fk_1',
    'four_of_a_kind',
    'fourOfAKind',
    '🃏',
    'Первое каре',
    'Собери каре',
    'Админ отметит комбинацию за столом.',
    1,
    1000,
    'rare',
  ),
  tier(
    'fk_3',
    'four_of_a_kind',
    'fourOfAKind',
    '🃏',
    '3 каре',
    'Три каре',
    'Три отметки каре.',
    3,
    2000,
    'rare',
  ),
  tier(
    'fk_5',
    'four_of_a_kind',
    'fourOfAKind',
    '🃏',
    '5 каре',
    'Пять каре',
    'Пять отметок каре.',
    5,
    3500,
    'epic',
  ),
  tier(
    'fk_10',
    'four_of_a_kind',
    'fourOfAKind',
    '🃏',
    '10 каре',
    'Десять каре',
    'Десять отметок каре.',
    10,
    6000,
    'epic',
  ),
  tier(
    'fk_20',
    'four_of_a_kind',
    'fourOfAKind',
    '🃏',
    '20 каре',
    'Двадцать каре',
    'Двадцать отметок каре.',
    20,
    10000,
    'legend',
  ),

  // 🃏 Стрит-флеш
  tier(
    'sf_1',
    'straight_flush',
    'straightFlush',
    '🃏',
    'Первый стрит-флеш',
    'Собери стрит-флеш',
    'Админ отметит комбинацию за столом.',
    1,
    4000,
    'epic',
  ),
  tier(
    'sf_2',
    'straight_flush',
    'straightFlush',
    '🃏',
    '2 стрит-флеша',
    'Два стрит-флеша',
    'Две отметки стрит-флеша.',
    2,
    6000,
    'epic',
  ),
  tier(
    'sf_3',
    'straight_flush',
    'straightFlush',
    '🃏',
    '3 стрит-флеша',
    'Три стрит-флеша',
    'Три отметки стрит-флеша.',
    3,
    9000,
    'legend',
  ),
  tier(
    'sf_5',
    'straight_flush',
    'straightFlush',
    '🃏',
    '5 стрит-флешей',
    'Пять стрит-флешей',
    'Пять отметок стрит-флеша.',
    5,
    15000,
    'legend',
  ),

  // 👑 Роял-флеш
  tier(
    'rf_1',
    'royal_flush',
    'royalFlush',
    '👑',
    'Первый роял-флеш',
    'Собери роял-флеш',
    'Редчайшая комбинация — админ отметит за столом.',
    1,
    7500,
    'legend',
  ),
  tier(
    'rf_2',
    'royal_flush',
    'royalFlush',
    '👑',
    '2 роял-флеша',
    'Два роял-флеша',
    'Две отметки роял-флеша.',
    2,
    12500,
    'legend',
  ),
  tier(
    'rf_3',
    'royal_flush',
    'royalFlush',
    '👑',
    '3 роял-флеша',
    'Три роял-флеша',
    'Три отметки роял-флеша.',
    3,
    20000,
    'legend',
  ),

  // ⚡ Особые
  tier(
    'sp_tutorial',
    'special',
    'tutorialCompleted',
    '⚡',
    'Прошёл обучение',
    'Заверши обучение',
    'Пройдите обучение / онбординг клуба.',
    1,
    500,
    'common',
  ),
  tier(
    'sp_referral',
    'special',
    'friendsReferred',
    '⚡',
    'Привёл первого друга',
    'Приведи друга в клуб',
    'Друг сыграет свой первый турнир.',
    1,
    1000,
    'common',
  ),
  tier(
    'sp_win_no_reentry',
    'special',
    'winNoReentry',
    '⚡',
    'Победа без повторного входа',
    'Выиграй без ре-энтри',
    '1 место при нулевых повторных входах.',
    1,
    2500,
    'rare',
  ),
  tier(
    'sp_short_stack',
    'special',
    'shortStackWins',
    '⚡',
    'Победа после стека < 10 BB',
    'Выиграй со короткого стека',
    'Админ отметит победу после стека менее 10 BB.',
    1,
    2500,
    'rare',
  ),
  tier(
    'sp_ft_streak_3',
    'special',
    'finalTableStreak',
    '⚡',
    '3 финальных стола подряд',
    'Три финалки подряд',
    'Три турнира подряд с попаданием в топ-9.',
    3,
    4000,
    'epic',
  ),
  tier(
    'sp_top10_streak_5',
    'special',
    'top10Streak',
    '⚡',
    '5 турниров подряд в топ-10',
    'Пять топ-10 подряд',
    'Пять турниров подряд в топ-10.',
    5,
    5000,
    'epic',
  ),
  tier(
    'sp_win_streak_2',
    'special',
    'backToBackWins',
    '⚡',
    '2 победы подряд',
    'Две победы подряд',
    'Выиграйте два турнира подряд.',
    2,
    7500,
    'epic',
  ),
  tier(
    'sp_win_streak_3',
    'special',
    'backToBackWins',
    '⚡',
    '3 победы подряд',
    'Три победы подряд',
    'Выиграйте три турнира подряд.',
    3,
    15000,
    'legend',
  ),

  // 👑 Легенда Gutshot
  {
    id: 'legend_gutshot',
    group: 'legend',
    metric: 'level',
    icon: '👑',
    title: 'Легенда Gutshot',
    description: 'Высшее признание клуба',
    howTo:
      '50 уровень, 50 турниров, 10 побед, 20 финальных столов, 3 попадания в топ-3 недели, ' +
      'топ-3 финала месяца, 5 каре или 1 стрит-флеш, победа без ре-энтри.',
    xp: 50000,
    target: 50,
    rarity: 'legend',
    span2: true,
    requires: {
      level: 50,
      tournamentsPlayed: 50,
      wins: 10,
      finalTables: 20,
      weeklyTop3: 3,
      monthlyPrizes: 1,
      winNoReentry: 1,
    },
  },
];

/** ID достижений, удалённых в v2 — чистим unlock-строки и пины. */
export const REMOVED_ACHIEVEMENT_IDS = [
  'win_25',
  'win_50',
  'ft_25',
  'ft_100',
  'ft_250',
  'tp_500',
  'tp_750',
  'tp_1000',
  'aw_52',
  'aw_100',
  'ko_500',
  'ko_1000',
  'fk_30',
  'fk_50',
  'fk_100',
  'sf_10',
  'rf_5',
  'mf_prize_1',
  'mf_win_10',
  'wr_top3_1',
  'wr_top3_3',
  'wr_top3_5',
  'wr_top3_10',
  'wr_win_1',
  'wr_win_3',
  'wr_win_5',
  'wr_win_10',
] as const;

export const ACHIEVEMENTS_BY_ID = new Map(ACHIEVEMENTS_CATALOG.map((item) => [item.id, item]));

/** Прогресс достижения от 0 до target. */
export function achievementProgress(
  definition: AchievementDefinition,
  metrics: AchievementMetrics,
): number {
  if (definition.id === 'legend_gutshot') {
    const requirements = definition.requires ?? {};
    const total = Object.keys(requirements).length + 1;
    let done = 0;

    for (const [metric, threshold] of Object.entries(requirements)) {
      if ((metrics[metric as AchievementMetric] ?? 0) >= (threshold as number)) {
        done += 1;
      }
    }

    // 5 каре ИЛИ 1 стрит-флеш
    if (metrics.fourOfAKind >= 5 || metrics.straightFlush >= 1) {
      done += 1;
    }

    return Math.round((done / total) * definition.target);
  }

  return Math.min(metrics[definition.metric] ?? 0, definition.target);
}

/** Достижение выполнено? */
export function isAchievementUnlocked(
  definition: AchievementDefinition,
  metrics: AchievementMetrics,
): boolean {
  return achievementProgress(definition, metrics) >= definition.target;
}
