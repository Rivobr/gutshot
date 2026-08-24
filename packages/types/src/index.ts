export type TournamentStatus =
  'DRAFT' | 'REGISTRATION_OPEN' | 'REGISTRATION_CLOSED' | 'IN_PROGRESS' | 'FINISHED' | 'ARCHIVED';

export type RegistrationStatus =
  'REGISTERED' | 'CHECKED_IN' | 'PLAYING' | 'FINISHED' | 'CANCELLED' | 'NO_SHOW' | 'WAITING';

export type AdminRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'DEALER';

export interface User {
  id: string;
  telegramId: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  nickname?: string | null;
  photoUrl?: string | null;
  isBlocked: boolean;
}

/**
 * Лёгкий профиль для boot Mini App (ConsentGate).
 * Без метрик/ачивок/истории — один быстрый SELECT.
 */
export interface PlayerBootstrapDto {
  id: string;
  telegramId: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  nickname?: string | null;
  photoUrl?: string | null;
  xp: number;
  consentAcceptedAt: string | null;
}

export interface PlayerProfileDto {
  id: string;
  telegramId: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  nickname?: string | null;
  photoUrl?: string | null;
  xp: number;
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progress: number;
  memberSince: string;
  isVerified: boolean;
  /** Постоянный персональный QR-код игрока. */
  qrCode: string;
  consentAcceptedAt?: string | null;
  /** Открыта «Легенда Gutshot» — титул + золотая рамка. */
  isLegendGutshot?: boolean;
  /** Достижения, закреплённые игроком в профиле (id из каталога). */
  pinnedAchievements: string[];
  stats: {
    tournamentsPlayed: number;
    wins: number;
    firstPlaces: number;
    itm: number;
    top10Percent: number;
    averagePlace: number | null;
    daysInClub: number;
    reEntries: number;
    bounties: number;
    /** Отметки явки (ARRIVED) — для достижений «посети клуб». */
    visits: number;
    /** Финиши в топ-9. */
    finalTables: number;
    /** Максимальная серия побед подряд (1 места). */
    winStreak: number;
    /** Число событий «Каре» (для прогрессивных достижений). */
    fourOfAKind: number;
    straightFlush: number;
    royalFlush: number;
    /** Недели, где сыграно 3+ турнира. */
    activeWeeks: number;
    /** Призовые места в недельном рейтинге. */
    weeklyTop3: number;
    weeklyWins: number;
    /** Финал месяца. */
    monthlyEntries: number;
    monthlyPrizes: number;
    monthlyWins: number;
    /** Особые достижения. */
    winNoReentry: number;
    backToBackWins: number;
    finalTableStreak: number;
    top10Streak: number;
    shortStackWins: number;
    tutorialCompleted: number;
    friendsReferred: number;
  };
  /** Открытые достижения каталога (id). */
  unlockedAchievements: string[];
  /** Прогресс по каждому достижению каталога: id → выполнено из target. */
  achievementProgress: Record<string, number>;
}

export interface TournamentParticipant {
  userId: string;
  firstName?: string | null;
  lastName?: string | null;
  nickname?: string | null;
  username?: string | null;
  photoUrl?: string | null;
  level: number;
  /** Витрина достижений игрока (id из каталога). */
  pinnedAchievements: string[];
  /** До 3 витринных достижений с редкостью (для свечения в списках). */
  showcaseAchievements?: ShowcaseAchievement[];
  top10Percent: number;
  status: RegistrationStatus;
}

/** Публичный профиль другого игрока (без telegramId / QR / личной истории). */
export interface PublicPlayerProfileDto {
  id: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  nickname?: string | null;
  photoUrl?: string | null;
  level: number;
  xp: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progress: number;
  memberSince: string;
  isVerified: boolean;
  isLegendGutshot: boolean;
  pinnedAchievements: string[];
  stats: {
    tournamentsPlayed: number;
    wins: number;
    firstPlaces: number;
    itm: number;
    top10Percent: number;
    averagePlace: number | null;
    daysInClub: number;
    finalTables: number;
  };
}

export interface TournamentLiveState {
  isRunning: boolean;
  level?: number | null;
  smallBlind?: number | null;
  bigBlind?: number | null;
  ante?: number | null;
  nextBreakInSec?: number | null;
  playersIn?: number | null;
  updatedAt?: string | null;
  /** Момент смены уровня — клиент тикает локально между запросами. */
  levelEndsAt?: string | null;
  levelSecondsLeft?: number | null;
  isBreak?: boolean;
  serverTime?: string | null;
}

export type ClockStatus = 'IDLE' | 'RUNNING' | 'PAUSED' | 'FINISHED';

/** Уровень структуры турнира: блайнды либо перерыв. */
export interface BlindLevel {
  idx: number;
  isBreak: boolean;
  smallBlind?: number | null;
  bigBlind?: number | null;
  ante?: number | null;
  durationSec: number;
}

export interface TournamentClockLevel extends BlindLevel {
  /** Номер игрового уровня; у перерывов null. */
  number: number | null;
}

export interface TournamentClock {
  status: ClockStatus;
  isRunning: boolean;
  current?: TournamentClockLevel | null;
  next?: TournamentClockLevel | null;
  secondsLeft?: number | null;
  secondsToBreak?: number | null;
  levelEndsAt?: string | null;
  breakAt?: string | null;
  playersIn?: number | null;
  levelsTotal: number;
  serverTime: string;
}

export interface Tournament {
  id: string;
  title: string;
  description?: string | null;
  date: string;
  buyIn: number;
  maxPlayers: number;
  status: TournamentStatus;
  registrationOpen?: string | null;
  registrationClose?: string | null;
  /** Обложка турнира (URL). */
  imageUrl?: string | null;
  live?: TournamentLiveState | null;
  _count?: { registrations: number };
}

export interface Registration {
  id: string;
  userId: string;
  tournamentId: string;
  status: RegistrationStatus;
  registeredAt: string;
  checkedInAt?: string | null;
  cancelledAt?: string | null;
  tournament?: Tournament;
}

/** Закреплённое / витринное достижение рядом с игроком в списках. */
export interface ShowcaseAchievement {
  id: string;
  group: AchievementGroup;
  rarity: AchievementRarity;
  title?: string;
  icon?: string;
}

export interface RatingEntry {
  /** Очки рейтинга (места в турнирах). */
  points?: number;
  rank: number;
  userId: string;
  firstName?: string | null;
  lastName?: string | null;
  nickname?: string | null;
  photoUrl?: string | null;
  username?: string | null;
  xp?: number;
  weeklyXp?: number;
  level?: number;
  /** До 3 витринных достижений (закреплённые или топ по редкости). */
  showcaseAchievements?: ShowcaseAchievement[];
  /** Сколько недель игрок проходил в топ-7 (для финала месяца). */
  qualifiedWeeks?: number;
  /** Какие недели месяца: 1 = открытие, 2 = следующая закрытая и т.д. */
  qualifiedWeekNumbers?: number[];
  /** Место в топ-7 текущей/закрытой недели. */
  weekPlace?: number;
}

/** Ответ недельного рейтинга с метаданными периода. */
export interface WeeklyRatingResponse {
  weekKey: string;
  monthKey: string;
  /** Какой период отдан клиенту. */
  period: 'current' | 'previous';
  /**
   * true, если текущая неделя ещё пустая и показана прошлая
   * (чтобы в понедельник утром таблица не «пропадала»).
   */
  fallbackFromEmptyCurrent: boolean;
  start: string;
  end: string;
  entries: RatingEntry[];
}

/** Результат закрытия недели: топ-7 переносят очки в финал месяца. */
export interface WeeklyCloseResultDto {
  weekKey: string;
  monthKey: string;
  alreadyClosed: boolean;
  rebuilt?: boolean;
  topN: number;
  qualified: RatingEntry[];
}

export interface NotificationDto {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface AdminUserDto {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}

export interface AdminPlayerListItem {
  id: string;
  telegramId: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  photoUrl?: string | null;
  nickname?: string | null;
  isBlocked: boolean;
  isVerified: boolean;
  /** Постоянный персональный QR-код игрока. */
  qrCode?: string | null;
  xp: number;
  level: number;
  visits: number;
  wins: number;
  createdAt: string;
}

export interface AdminRecentRegistration {
  id: string;
  status: RegistrationStatus;
  user?: Pick<User, 'firstName' | 'lastName'> | null;
  tournament?: Pick<Tournament, 'title'> | null;
}

export interface AdminDashboard {
  playersCount: number;
  activeTournaments: number;
  nearestTournament: (Tournament & { _count: { registrations: number } }) | null;
  registrationsCount: number;
  freeSlots: number;
  recentRegistrations: AdminRecentRegistration[];
}

export interface AdminTopPlayer {
  userId: string;
  name: string;
  xp: number;
}

export interface AdminTopTournament {
  id: string;
  title: string;
  registrations: number;
}

/** Одна запись ре-энтри (ребая) из истории сканера. */
export interface AdminRebuyEntry {
  id: string;
  createdAt: string;
  userId: string;
  playerName: string;
  username?: string | null;
  telegramId: string;
  tournamentId?: string | null;
  tournamentTitle?: string | null;
}

export interface AdminStatistics {
  playersCount: number;
  tournamentsCount: number;
  totalVisits: number;
  totalWins: number;
  averageAttendance: number;
  /** Всего ребаев (событий RE_ENTRY). */
  totalRebuys: number;
  /** Последние ребаи: кто и когда. */
  recentRebuys: AdminRebuyEntry[];
  topPlayers: AdminTopPlayer[];
  topTournaments: AdminTopTournament[];
}

export type PlayerEventType =
  | 'TOURNAMENT_REGISTRATION'
  | 'TOURNAMENT_CANCELLED'
  | 'ARRIVED'
  | 'ELIMINATED'
  | 'RE_ENTRY'
  | 'BOUNTY'
  | 'FOUR_OF_A_KIND'
  | 'STRAIGHT_FLUSH'
  | 'ROYAL_FLUSH'
  | 'XP_CHANGE'
  | 'LEVEL_UP'
  | 'TOURNAMENT_RESULT'
  | 'ACHIEVEMENT_UNLOCKED'
  | 'WEEKLY_RATING_REWARD'
  | 'MONTHLY_FINAL_REWARD'
  | 'TUTORIAL_COMPLETED'
  | 'FRIEND_REFERRED'
  | 'SHORT_STACK_WIN';

/** События, которые сотрудник клуба может отметить после сканирования QR. */
export type ScannerEventType =
  | 'ARRIVED'
  | 'ELIMINATED'
  | 'RE_ENTRY'
  | 'BOUNTY'
  | 'FOUR_OF_A_KIND'
  | 'STRAIGHT_FLUSH'
  | 'ROYAL_FLUSH'
  | 'TUTORIAL_COMPLETED'
  | 'FRIEND_REFERRED'
  | 'SHORT_STACK_WIN';

export type AchievementCode = 'FOUR_OF_A_KIND' | 'STRAIGHT_FLUSH' | 'ROYAL_FLUSH';

export type XpSettingKey =
  | 'ATTENDANCE'
  | 'ELIMINATION'
  | 'RE_ENTRY'
  | 'BOUNTY'
  | 'FOUR_OF_A_KIND'
  | 'STRAIGHT_FLUSH'
  | 'ROYAL_FLUSH'
  | 'TOURNAMENT_WIN'
  | 'PLACE_2'
  | 'PLACE_3'
  | 'PLACE_4'
  | 'PLACE_5'
  | 'PLACE_6'
  | 'PLACE_7'
  | 'PLACE_8'
  | 'PLACE_9'
  | 'PLACE_10'
  | 'PLACE_11'
  | 'PLACE_12'
  | 'PLACE_13'
  | 'PLACE_14'
  | 'PLACE_15'
  | 'PLACE_16'
  | 'PLACE_17'
  | 'PLACE_18'
  | 'PLACE_19'
  | 'PLACE_20'
  | 'PLACE_21'
  | 'PLACE_22'
  | 'PLACE_23'
  | 'PLACE_24'
  | 'PLACE_25'
  | 'PLACE_26'
  | 'PLACE_27'
  | 'PLACE_28'
  | 'PLACE_29'
  | 'PLACE_30'
  | 'PLACE_31_40'
  | 'PLACE_41_50'
  | 'PLACE_51_PLUS'
  | 'WEEKLY_TOP_1'
  | 'WEEKLY_TOP_2'
  | 'WEEKLY_TOP_3'
  | 'MONTHLY_TOP_1'
  | 'MONTHLY_TOP_2'
  | 'MONTHLY_TOP_3';

/** Последнее индивидуально редактируемое место в админке. */
export const MAX_SCORING_PLACE = 30;

/** Диапазоны мест ниже топ-30. */
export const PLACE_BAND_KEYS = ['PLACE_31_40', 'PLACE_41_50', 'PLACE_51_PLUS'] as const;

export type PlaceBandKey = (typeof PLACE_BAND_KEYS)[number];

export const PLACE_BAND_LABELS: Record<PlaceBandKey, string> = {
  PLACE_31_40: '31–40 место',
  PLACE_41_50: '41–50 место',
  PLACE_51_PLUS: '51+ место',
};

/** Ключи шкалы рейтинга: место → настройка XP. */
export const PLACE_RATING_KEY_BY_PLACE: Record<number, XpSettingKey> = {
  1: 'TOURNAMENT_WIN',
  2: 'PLACE_2',
  3: 'PLACE_3',
  4: 'PLACE_4',
  5: 'PLACE_5',
  6: 'PLACE_6',
  7: 'PLACE_7',
  8: 'PLACE_8',
  9: 'PLACE_9',
  10: 'PLACE_10',
  11: 'PLACE_11',
  12: 'PLACE_12',
  13: 'PLACE_13',
  14: 'PLACE_14',
  15: 'PLACE_15',
  16: 'PLACE_16',
  17: 'PLACE_17',
  18: 'PLACE_18',
  19: 'PLACE_19',
  20: 'PLACE_20',
  21: 'PLACE_21',
  22: 'PLACE_22',
  23: 'PLACE_23',
  24: 'PLACE_24',
  25: 'PLACE_25',
  26: 'PLACE_26',
  27: 'PLACE_27',
  28: 'PLACE_28',
  29: 'PLACE_29',
  30: 'PLACE_30',
};

/** Награды за места в недельном рейтинге и финале месяца. */
export const RATING_REWARD_KEYS: XpSettingKey[] = [
  'WEEKLY_TOP_1',
  'WEEKLY_TOP_2',
  'WEEKLY_TOP_3',
  'MONTHLY_TOP_1',
  'MONTHLY_TOP_2',
  'MONTHLY_TOP_3',
];

export const PLACE_RATING_KEYS: XpSettingKey[] = Object.values(PLACE_RATING_KEY_BY_PLACE);

export interface PlaceRatingRow {
  place: number;
  points: number;
  /** Разница с предыдущим местом (для 1 места — null). */
  diff: number | null;
}

export interface PlaceRatingScaleDto {
  rows: PlaceRatingRow[];
  totalPoints: number;
}

/** Собирает шкалу рейтинга 1–30 из карты настроек XP. */
export function buildPlaceRatingScale(
  settings: Partial<Record<XpSettingKey, number>>,
): PlaceRatingScaleDto {
  const rows: PlaceRatingRow[] = [];

  for (let place = 1; place <= MAX_SCORING_PLACE; place += 1) {
    const key = PLACE_RATING_KEY_BY_PLACE[place];
    const points = settings[key] ?? 0;
    const previous = place === 1 ? null : (rows[place - 2]?.points ?? 0);
    rows.push({
      place,
      points,
      diff: previous === null ? null : points - previous,
    });
  }

  return {
    rows,
    totalPoints: rows.reduce((sum, row) => sum + row.points, 0),
  };
}

export type LegalDocumentType =
  'CLUB_RULES' | 'USER_AGREEMENT' | 'PERSONAL_DATA_CONSENT' | 'MEDIA_CONSENT';

export interface PlayerEventDto {
  id: string;
  type: PlayerEventType;
  xpAmount: number;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  tournament?: Pick<Tournament, 'id' | 'title'> | null;
  performedBy?: { id: string; name: string } | null;
  user?: Pick<User, 'id' | 'firstName' | 'lastName' | 'photoUrl'> | null;
}

export interface AchievementDto {
  id: string;
  code: AchievementCode;
  tournamentId?: string | null;
  unlockedAt: string;
}

export interface XpSettingDto {
  key: XpSettingKey;
  value: number;
}

export interface LevelThresholdDto {
  level: number;
  requiredXp: number;
  title?: string | null;
}

export interface XpConfigDto {
  settings: XpSettingDto[];
  levels: LevelThresholdDto[];
}

export interface LegalDocumentDto {
  type: LegalDocumentType;
  title: string;
  content: string;
  version: number;
  updatedAt: string;
}

/** Редактируемый текст достижения (id из ACHIEVEMENTS_CATALOG). */
export type AchievementTextId = string;

export interface AchievementTextDto {
  id: AchievementTextId;
  icon: string;
  title: string;
  description: string;
  howTo: string;
  updatedAt: string;
}

/** Карточка игрока, показываемая сотруднику после сканирования QR. */
export interface ScannedPlayerDto {
  userId: string;
  telegramId: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  nickname?: string | null;
  photoUrl?: string | null;
  isBlocked: boolean;
  level: number;
  xp: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progress: number;
  achievements: AchievementDto[];
  registration: {
    id: string;
    tournamentId: string;
    tournamentTitle: string;
    status: RegistrationStatus;
    registeredAt: string;
    arrivedAt?: string | null;
    attendanceXpGiven: boolean;
    reEntries: number;
    bounties: number;
  } | null;
  recentEvents: PlayerEventDto[];
}

export interface ScannerEventResultDto {
  event: PlayerEventDto;
  xpAwarded: number;
  totalXp: number;
  level: number;
  levelUp: boolean;
  achievementUnlocked: AchievementCode | null;
  /** Достижения каталога, открытые этим событием. */
  unlockedAchievements?: { id: string; title: string; xp: number }[];
}

/** Выплата наград за недельный рейтинг / финал месяца. */
export interface RatingRewardPayoutDto {
  periodType: 'WEEKLY' | 'MONTHLY';
  periodKey: string;
  awarded: {
    userId: string;
    place: number;
    xp: number;
    nickname?: string | null;
    firstName?: string | null;
  }[];
  skipped: number;
}

export interface AdminTournamentRegistration {
  id: string;
  status: RegistrationStatus;
  registeredAt: string;
  arrivedAt?: string | null;
  attendanceXpGiven: boolean;
  eliminatedAt?: string | null;
  /** Место, проставленное до или при завершении турнира. */
  place?: number | null;
  reEntries: number;
  bounties: number;
  user: {
    id: string;
    telegramId: string;
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    nickname?: string | null;
    photoUrl?: string | null;
    /** Постоянный персональный QR — для печати из карточки турнира. */
    qrCode?: string | null;
    xp: number;
    level: number;
  };
}

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

/** Определение достижения из каталога клуба (отдаётся API). */
export interface AchievementDefinitionDto {
  id: string;
  group: AchievementGroup;
  icon: string;
  title: string;
  description: string;
  howTo: string;
  xp: number;
  target: number;
  rarity: AchievementRarity;
  span2?: boolean;
}

export const ACHIEVEMENT_GROUP_LABELS: Record<AchievementGroup, string> = {
  wins: 'Победы в турнирах',
  final_tables: 'Финальные столы',
  tournaments: 'Сыгранные турниры',
  active_weeks: 'Активные недели',
  weekly_rating: 'Недельный рейтинг',
  monthly_final: 'Финал месяца',
  four_of_a_kind: 'Каре',
  straight_flush: 'Стрит-флеш',
  royal_flush: 'Роял-флеш',
  special: 'Особые достижения',
  knockouts: 'Нокауты',
  legend: 'Легенда Gutshot',
};

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
}

export type BroadcastStatus = 'DRAFT' | 'SENDING' | 'SENT' | 'FAILED';
export type BroadcastSegment =
  'ALL_ACTIVE' | 'TOURNAMENT_REGISTERED' | 'TOURNAMENT_RSVP_PENDING' | 'SINGLE_PLAYER';
export type BroadcastButtons = 'NONE' | 'OPEN_APP' | 'RSVP' | 'CUSTOM';
export type BroadcastDeliveryStatus = 'PENDING' | 'SENT' | 'FAILED' | 'SKIPPED';

export interface BroadcastCustomButton {
  text: string;
  type?: 'url' | 'open_app';
  url?: string;
}

export interface BroadcastCampaignDto {
  id: string;
  title: string;
  bodyHtml: string;
  segment: BroadcastSegment;
  tournamentId: string | null;
  targetUserId: string | null;
  photoUrl: string | null;
  buttons: BroadcastButtons;
  customButtons: BroadcastCustomButton[];
  status: BroadcastStatus;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
  tournament: { id: string; title: string; date: string } | null;
  targetUser: { id: string; name: string; telegramId: string } | null;
}

export interface BroadcastDeliveryDto {
  id: string;
  userId: string;
  telegramId: string;
  status: BroadcastDeliveryStatus;
  telegramMessageId: number | null;
  chatId: string | null;
  error: string | null;
  sentAt: string | null;
  name: string;
}

export interface BroadcastCampaignDetailsDto extends BroadcastCampaignDto {
  deliveries: BroadcastDeliveryDto[];
}

export interface BroadcastSegmentPreviewDto {
  segment: BroadcastSegment;
  tournamentId: string | null;
  targetUserId: string | null;
  count: number;
  sample: Array<{ userId: string; telegramId: string; name: string }>;
}

// ── Web auth (сайт клуба) ──────────────────────────────────

export interface WebAuthUser {
  id: string;
  telegramId: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  nickname?: string | null;
  photoUrl?: string | null;
}

export interface WebAuthResponse {
  accessToken: string;
  user: WebAuthUser;
  /** true — аккаунт создан по телефону, ник автогенерирован: попросить сменить. */
  needsNickname?: boolean;
}

export interface OtpRequestResponse {
  resendAfterSeconds: number;
}

export interface PublicScheduleDay {
  day: string;
  time: string;
  kind: string;
}

export interface PublicClubInfo {
  name: string;
  address: string;
  phone: string;
  legalName: string;
  inn: string;
  support: string;
}

export interface PublicLandingResponse {
  nearestTournament: Tournament | null;
  schedule: PublicScheduleDay[];
  club: PublicClubInfo;
}

export interface PublicWeeklyRatingResponse {
  weekKey: string;
  start: string;
  end: string;
  period: 'current' | 'previous';
  entries: RatingEntry[];
}
