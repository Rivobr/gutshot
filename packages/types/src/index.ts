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
  photoUrl?: string | null;
  isBlocked: boolean;
}

export interface PlayerProfileDto {
  id: string;
  telegramId: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  photoUrl?: string | null;
  xp: number;
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progress: number;
  stats: {
    tournamentsPlayed: number;
    wins: number;
  };
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
  rank: number;
  userId: string;
  firstName?: string | null;
  lastName?: string | null;
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

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
}
