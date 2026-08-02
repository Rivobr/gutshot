export type TournamentStatus =
  | 'DRAFT'
  | 'REGISTRATION_OPEN'
  | 'REGISTRATION_CLOSED'
  | 'IN_PROGRESS'
  | 'FINISHED'
  | 'ARCHIVED';

export type RegistrationStatus =
  | 'REGISTERED'
  | 'CHECKED_IN'
  | 'PLAYING'
  | 'FINISHED'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'WAITING';

export type AdminRole = 'OWNER' | 'ADMIN' | 'MANAGER';

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
  };
}

export interface TournamentParticipant {
  userId: string;
  firstName?: string | null;
  lastName?: string | null;
  nickname?: string | null;
  username?: string | null;
  photoUrl?: string | null;
  level: number;
  top10Percent: number;
  status: RegistrationStatus;
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

export interface RatingEntry {
  /** Очки рейтинга (места в турнирах). */
  points?: number;
  rank: number;
  userId: string;
  firstName?: string | null;
  lastName?: string | null;
  nickname?: string | null;
  photoUrl?: string | null;
  xp?: number;
  weeklyXp?: number;
  level?: number;
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
  isBlocked: boolean;
  isVerified: boolean;
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

export interface AdminStatistics {
  playersCount: number;
  tournamentsCount: number;
  totalVisits: number;
  totalWins: number;
  averageAttendance: number;
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
  | 'ACHIEVEMENT_UNLOCKED';

/** События, которые сотрудник клуба может отметить после сканирования QR. */
export type ScannerEventType =
  | 'ARRIVED'
  | 'ELIMINATED'
  | 'RE_ENTRY'
  | 'BOUNTY'
  | 'FOUR_OF_A_KIND'
  | 'STRAIGHT_FLUSH'
  | 'ROYAL_FLUSH';

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
  | 'PLACE_20';

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
};

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

/** Собирает шкалу рейтинга 1–20 из карты настроек XP. */
export function buildPlaceRatingScale(
  settings: Partial<Record<XpSettingKey, number>>,
): PlaceRatingScaleDto {
  const rows: PlaceRatingRow[] = [];

  for (let place = 1; place <= 20; place += 1) {
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
  | 'CLUB_RULES'
  | 'USER_AGREEMENT'
  | 'PERSONAL_DATA_CONSENT'
  | 'MEDIA_CONSENT';

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

/** Редактируемый текст достижения (отображение в Mini App). */
export type AchievementTextId =
  | 'first_visit'
  | 'visit_5'
  | 'four_kind'
  | 'first_knockout'
  | 'royal_flush'
  | 'visit_10'
  | 'first_win'
  | 'straight_flush'
  | 'final_table'
  | 'win_streak';

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
}

export interface AdminTournamentRegistration {
  id: string;
  status: RegistrationStatus;
  registeredAt: string;
  arrivedAt?: string | null;
  attendanceXpGiven: boolean;
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
    xp: number;
    level: number;
  };
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
}
