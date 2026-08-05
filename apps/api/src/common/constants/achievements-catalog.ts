/**
 * Каталог достижений Gutshot (ТЗ клуба).
 *
 * Единый источник правды: сервер по нему начисляет XP,
 * Mini App по нему рисует прогресс. Тексты можно переопределить в админке.
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
  /** XP, начисляемый один раз при открытии. */
  xp: number;
  /** Порог метрики для открытия. */
  target: number;
  metric: AchievementMetric;
  rarity: AchievementRarity;
  /** Занимает две клетки в сетке Mini App. */
  span2?: boolean;
  /** Требуется выполнение всех условий (для «Легенды»). */
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
  // 🏆 Победы в турнирах
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
    'rare',
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
    'epic',
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
    'Пятнадцать первых мест.',
    15,
    15000,
    'epic',
  ),
  tier(
    'win_25',
    'wins',
    'wins',
    '🏆',
    '25 побед',
    'Выиграй 25 турниров',
    'Двадцать пять первых мест.',
    25,
    25000,
    'legend',
  ),
  tier(
    'win_50',
    'wins',
    'wins',
    '🏆',
    '50 побед',
    'Выиграй 50 турниров',
    'Пятьдесят первых мест.',
    50,
    45000,
    'legend',
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
    '5 финальных столов',
    'Пять финалок',
    'Пять раз попасть в топ-9.',
    5,
    2500,
    'rare',
  ),
  tier(
    'ft_10',
    'final_tables',
    'finalTables',
    '🎯',
    '10 финальных столов',
    'Десять финалок',
    'Десять раз попасть в топ-9.',
    10,
    5000,
    'rare',
  ),
  tier(
    'ft_25',
    'final_tables',
    'finalTables',
    '🎯',
    '25 финальных столов',
    'Двадцать пять финалок',
    'Двадцать пять раз попасть в топ-9.',
    25,
    10000,
    'epic',
  ),
  tier(
    'ft_50',
    'final_tables',
    'finalTables',
    '🎯',
    '50 финальных столов',
    'Пятьдесят финалок',
    'Пятьдесят раз попасть в топ-9.',
    50,
    18000,
    'epic',
  ),
  tier(
    'ft_100',
    'final_tables',
    'finalTables',
    '🎯',
    '100 финальных столов',
    'Сто финалок',
    'Сто раз попасть в топ-9.',
    100,
    30000,
    'legend',
  ),
  tier(
    'ft_250',
    'final_tables',
    'finalTables',
    '🎯',
    '250 финальных столов',
    'Двести пятьдесят финалок',
    'Двести пятьдесят раз попасть в топ-9.',
    250,
    50000,
    'legend',
  ),

  // 🎮 Сыгранные турниры
  tier(
    'tp_5',
    'tournaments',
    'tournamentsPlayed',
    '🎮',
    '5 турниров',
    'Сыграй 5 турниров',
    'Примите участие в пяти турнирах.',
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
    'Примите участие в десяти турнирах.',
    10,
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
    'Двадцать пять сыгранных турниров.',
    25,
    2500,
    'common',
  ),
  tier(
    'tp_50',
    'tournaments',
    'tournamentsPlayed',
    '🎮',
    '50 турниров',
    'Сыграй 50 турниров',
    'Пятьдесят сыгранных турниров.',
    50,
    5000,
    'rare',
  ),
  tier(
    'tp_100',
    'tournaments',
    'tournamentsPlayed',
    '🎮',
    '100 турниров',
    'Сыграй 100 турниров',
    'Сто сыгранных турниров.',
    100,
    10000,
    'rare',
  ),
  tier(
    'tp_200',
    'tournaments',
    'tournamentsPlayed',
    '🎮',
    '200 турниров',
    'Сыграй 200 турниров',
    'Двести сыгранных турниров.',
    200,
    18000,
    'epic',
  ),
  tier(
    'tp_300',
    'tournaments',
    'tournamentsPlayed',
    '🎮',
    '300 турниров',
    'Сыграй 300 турниров',
    'Триста сыгранных турниров.',
    300,
    28000,
    'epic',
  ),
  tier(
    'tp_500',
    'tournaments',
    'tournamentsPlayed',
    '🎮',
    '500 турниров',
    'Сыграй 500 турниров',
    'Пятьсот сыгранных турниров.',
    500,
    45000,
    'legend',
  ),
  tier(
    'tp_750',
    'tournaments',
    'tournamentsPlayed',
    '🎮',
    '750 турниров',
    'Сыграй 750 турниров',
    'Семьсот пятьдесят сыгранных турниров.',
    750,
    65000,
    'legend',
  ),
  tier(
    'tp_1000',
    'tournaments',
    'tournamentsPlayed',
    '🎮',
    '1000 турниров',
    'Сыграй 1000 турниров',
    'Тысяча сыгранных турниров.',
    1000,
    90000,
    'legend',
  ),

  // 🔥 Активные недели (минимум 3 турнира за неделю)
  tier(
    'aw_5',
    'active_weeks',
    'activeWeeks',
    '🔥',
    '5 активных недель',
    'Минимум 3 турнира за неделю',
    'Неделя засчитывается, если сыграно не менее 3 турниров.',
    5,
    1000,
    'common',
  ),
  tier(
    'aw_10',
    'active_weeks',
    'activeWeeks',
    '🔥',
    '10 активных недель',
    'Минимум 3 турнира за неделю',
    'Десять недель по 3+ турнира.',
    10,
    2500,
    'rare',
  ),
  tier(
    'aw_25',
    'active_weeks',
    'activeWeeks',
    '🔥',
    '25 активных недель',
    'Минимум 3 турнира за неделю',
    'Двадцать пять недель по 3+ турнира.',
    25,
    7500,
    'epic',
  ),
  tier(
    'aw_52',
    'active_weeks',
    'activeWeeks',
    '🔥',
    '52 активные недели',
    'Год активной игры',
    'Пятьдесят две недели по 3+ турнира.',
    52,
    20000,
    'legend',
  ),
  tier(
    'aw_100',
    'active_weeks',
    'activeWeeks',
    '🔥',
    '100 активных недель',
    'Ветеран клуба',
    'Сто недель по 3+ турнира.',
    100,
    40000,
    'legend',
  ),

  // 📈 Недельный рейтинг
  tier(
    'wr_top3_1',
    'weekly_rating',
    'weeklyTop3',
    '📈',
    'Первый раз в топ-3',
    'Топ-3 недельного рейтинга',
    'Займите место в тройке недельного рейтинга.',
    1,
    2000,
    'rare',
  ),
  tier(
    'wr_top3_3',
    'weekly_rating',
    'weeklyTop3',
    '📈',
    'Топ-3 три раза',
    'Три недели в тройке',
    'Трижды попасть в топ-3 недели.',
    3,
    5000,
    'rare',
  ),
  tier(
    'wr_top3_10',
    'weekly_rating',
    'weeklyTop3',
    '📈',
    'Топ-3 десять раз',
    'Десять недель в тройке',
    'Десять раз попасть в топ-3 недели.',
    10,
    12000,
    'epic',
  ),
  tier(
    'wr_top3_25',
    'weekly_rating',
    'weeklyTop3',
    '📈',
    'Топ-3 25 раз',
    'Двадцать пять недель в тройке',
    'Двадцать пять раз попасть в топ-3 недели.',
    25,
    25000,
    'legend',
  ),
  tier(
    'wr_win_1',
    'weekly_rating',
    'weeklyWins',
    '📈',
    'Первая победа в неделе',
    '1 место недельного рейтинга',
    'Возглавьте недельный рейтинг клуба.',
    1,
    5000,
    'rare',
  ),
  tier(
    'wr_win_5',
    'weekly_rating',
    'weeklyWins',
    '📈',
    '5 побед в неделе',
    'Пять недель первым',
    'Пять раз занять 1 место недели.',
    5,
    15000,
    'epic',
  ),
  tier(
    'wr_win_10',
    'weekly_rating',
    'weeklyWins',
    '📈',
    '10 побед в неделе',
    'Десять недель первым',
    'Десять раз занять 1 место недели.',
    10,
    30000,
    'legend',
  ),
  tier(
    'wr_win_25',
    'weekly_rating',
    'weeklyWins',
    '📈',
    '25 побед в неделе',
    'Двадцать пять недель первым',
    'Двадцать пять раз занять 1 место недели.',
    25,
    60000,
    'legend',
  ),

  // 👑 Финал месяца
  tier(
    'mf_entry_1',
    'monthly_final',
    'monthlyEntries',
    '👑',
    'Первое участие в финале месяца',
    'Сыграй финал месяца',
    'Пройдите отбор и сыграйте финал месяца.',
    1,
    2000,
    'rare',
  ),
  tier(
    'mf_prize_1',
    'monthly_final',
    'monthlyPrizes',
    '👑',
    'Первый приз финала месяца',
    'Топ-3 финала месяца',
    'Займите призовое место в финале месяца.',
    1,
    5000,
    'epic',
  ),
  tier(
    'mf_win_1',
    'monthly_final',
    'monthlyWins',
    '👑',
    'Первая победа в финале месяца',
    'Выиграй финал месяца',
    'Займите 1 место в финале месяца.',
    1,
    10000,
    'epic',
  ),
  tier(
    'mf_win_3',
    'monthly_final',
    'monthlyWins',
    '👑',
    '3 победы в финале месяца',
    'Три титула',
    'Трижды выиграть финал месяца.',
    3,
    25000,
    'legend',
  ),
  tier(
    'mf_win_5',
    'monthly_final',
    'monthlyWins',
    '👑',
    '5 побед в финале месяца',
    'Пять титулов',
    'Пять раз выиграть финал месяца.',
    5,
    45000,
    'legend',
  ),
  tier(
    'mf_win_10',
    'monthly_final',
    'monthlyWins',
    '👑',
    '10 побед в финале месяца',
    'Десять титулов',
    'Десять раз выиграть финал месяца.',
    10,
    80000,
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
    'Соберите каре и покажите QR администратору.',
    1,
    1000,
    'rare',
  ),
  tier(
    'fk_5',
    'four_of_a_kind',
    'fourOfAKind',
    '🃏',
    '5 каре',
    'Пять каре',
    'Пять отметок события «Каре».',
    5,
    3000,
    'rare',
  ),
  tier(
    'fk_10',
    'four_of_a_kind',
    'fourOfAKind',
    '🃏',
    '10 каре',
    'Десять каре',
    'Десять отметок события «Каре».',
    10,
    7000,
    'epic',
  ),
  tier(
    'fk_30',
    'four_of_a_kind',
    'fourOfAKind',
    '🃏',
    '30 каре',
    'Тридцать каре',
    'Тридцать отметок события «Каре».',
    30,
    15000,
    'epic',
  ),
  tier(
    'fk_50',
    'four_of_a_kind',
    'fourOfAKind',
    '🃏',
    '50 каре',
    'Пятьдесят каре',
    'Пятьдесят отметок события «Каре».',
    50,
    25000,
    'legend',
  ),
  tier(
    'fk_100',
    'four_of_a_kind',
    'fourOfAKind',
    '🃏',
    '100 каре',
    'Сто каре',
    'Сто отметок события «Каре».',
    100,
    40000,
    'legend',
  ),

  // 🃏 Стрит-флеш
  tier(
    'sf_1',
    'straight_flush',
    'straightFlush',
    '🎴',
    'Первый стрит-флеш',
    'Собери стрит-флеш',
    'Соберите стрит-флеш и покажите QR администратору.',
    1,
    7500,
    'epic',
  ),
  tier(
    'sf_3',
    'straight_flush',
    'straightFlush',
    '🎴',
    '3 стрит-флеша',
    'Три стрит-флеша',
    'Три отметки события «Стрит-флеш».',
    3,
    15000,
    'epic',
  ),
  tier(
    'sf_5',
    'straight_flush',
    'straightFlush',
    '🎴',
    '5 стрит-флешей',
    'Пять стрит-флешей',
    'Пять отметок события «Стрит-флеш».',
    5,
    25000,
    'legend',
  ),
  tier(
    'sf_10',
    'straight_flush',
    'straightFlush',
    '🎴',
    '10 стрит-флешей',
    'Десять стрит-флешей',
    'Десять отметок события «Стрит-флеш».',
    10,
    45000,
    'legend',
  ),

  // 👑 Роял-флеш
  tier(
    'rf_1',
    'royal_flush',
    'royalFlush',
    '💎',
    'Первый роял-флеш',
    'Собери роял-флеш',
    'Соберите Т–К–Д–В–10 одной масти и покажите QR.',
    1,
    20000,
    'legend',
  ),
  tier(
    'rf_2',
    'royal_flush',
    'royalFlush',
    '💎',
    '2 роял-флеша',
    'Два роял-флеша',
    'Две отметки события «Роял-флеш».',
    2,
    35000,
    'legend',
  ),
  tier(
    'rf_5',
    'royal_flush',
    'royalFlush',
    '💎',
    '5 роял-флешей',
    'Пять роял-флешей',
    'Пять отметок события «Роял-флеш».',
    5,
    70000,
    'legend',
  ),

  // ⚡ Особые
  tier(
    'sp_no_reentry',
    'special',
    'winNoReentry',
    '⚡',
    'Победа без ре-энтри',
    'Выиграй с одного входа',
    'Выиграйте турнир, не используя повторный вход.',
    1,
    2500,
    'rare',
  ),
  tier(
    'sp_back_to_back',
    'special',
    'backToBackWins',
    '⚡',
    'Две победы подряд',
    'Два турнира подряд первым',
    'Выиграйте два турнира подряд.',
    1,
    6000,
    'epic',
  ),
  tier(
    'sp_ft_streak',
    'special',
    'finalTableStreak',
    '⚡',
    'Три финалки подряд',
    'Три турнира подряд в топ-9',
    'Три турнира подряд с выходом за финальный стол.',
    3,
    5000,
    'epic',
  ),
  tier(
    'sp_top10_streak',
    'special',
    'top10Streak',
    '⚡',
    'Пять раз подряд в топ-10',
    'Стабильность',
    'Пять турниров подряд с местом в топ-10.',
    5,
    7500,
    'epic',
  ),
  tier(
    'sp_short_stack',
    'special',
    'shortStackWins',
    '⚡',
    'Победа со стека менее 10 BB',
    'Камбэк',
    'Выиграйте турнир, отыгравшись со стека менее 10 больших блайндов.',
    1,
    3000,
    'epic',
  ),
  tier(
    'sp_tutorial',
    'special',
    'tutorialCompleted',
    '⚡',
    'Прошёл обучение',
    'Бесплатное обучение клуба',
    'Пройдите обучение у администратора клуба.',
    1,
    1000,
    'common',
  ),
  tier(
    'sp_referral',
    'special',
    'friendsReferred',
    '⚡',
    'Привёл первого друга',
    'Приведи друга в клуб',
    'Приведите друга, который сыграет свой первый турнир.',
    1,
    2000,
    'common',
  ),

  // 💀 Нокауты
  tier(
    'ko_1',
    'knockouts',
    'knockouts',
    '💀',
    'Первый нокаут',
    'Выбей соперника',
    'Выбейте игрока из турнира — админ отметит «Баунти».',
    1,
    500,
    'common',
  ),
  tier(
    'ko_5',
    'knockouts',
    'knockouts',
    '💀',
    '5 нокаутов',
    'Пять выбитых',
    'Пять отметок баунти.',
    5,
    1500,
    'common',
  ),
  tier(
    'ko_10',
    'knockouts',
    'knockouts',
    '💀',
    '10 нокаутов',
    'Десять выбитых',
    'Десять отметок баунти.',
    10,
    3000,
    'common',
  ),
  tier(
    'ko_25',
    'knockouts',
    'knockouts',
    '💀',
    '25 нокаутов',
    'Двадцать пять выбитых',
    'Двадцать пять отметок баунти.',
    25,
    7000,
    'rare',
  ),
  tier(
    'ko_50',
    'knockouts',
    'knockouts',
    '💀',
    '50 нокаутов',
    'Пятьдесят выбитых',
    'Пятьдесят отметок баунти.',
    50,
    12000,
    'rare',
  ),
  tier(
    'ko_100',
    'knockouts',
    'knockouts',
    '💀',
    '100 нокаутов',
    'Сто выбитых',
    'Сто отметок баунти.',
    100,
    20000,
    'epic',
  ),
  tier(
    'ko_250',
    'knockouts',
    'knockouts',
    '💀',
    '250 нокаутов',
    'Двести пятьдесят выбитых',
    'Двести пятьдесят отметок баунти.',
    250,
    35000,
    'epic',
  ),
  tier(
    'ko_500',
    'knockouts',
    'knockouts',
    '💀',
    '500 нокаутов',
    'Пятьсот выбитых',
    'Пятьсот отметок баунти.',
    500,
    60000,
    'legend',
  ),
  tier(
    'ko_1000',
    'knockouts',
    'knockouts',
    '💀',
    '1000 нокаутов',
    'Тысяча выбитых',
    'Тысяча отметок баунти.',
    1000,
    100000,
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
      '50 уровень, 100 турниров, 10 побед, 25 финальных столов, 3 попадания в топ-3 недели, ' +
      'призовое место в финале месяца, 5 каре или 1 стрит-флеш, победа без ре-энтри.',
    xp: 50000,
    target: 50,
    rarity: 'legend',
    span2: true,
    requires: {
      level: 50,
      tournamentsPlayed: 100,
      wins: 10,
      finalTables: 25,
      weeklyTop3: 3,
      monthlyPrizes: 1,
      winNoReentry: 1,
    },
  },
];

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
