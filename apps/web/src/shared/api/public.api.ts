import { apiGet, apiPost } from '@/shared/api/client';
import type {
  PublicLandingResponse,
  PublicMonthlyRatingResponse,
  Registration,
  Tournament,
  MonthlyRatingResponse,
} from '@gutshot/types';

export interface OverallRatingEntry {
  rank: number;
  userId: string;
  firstName?: string | null;
  lastName?: string | null;
  nickname?: string | null;
  level?: number;
  points: number;
}

export const publicApi = {
  landing: () => apiGet<PublicLandingResponse>('/public/landing'),
  monthlyRating: (mode: 'current' | 'previous' = 'current') =>
    apiGet<PublicMonthlyRatingResponse>(`/public/ratings/monthly?mode=${mode}`),
  overallRating: () =>
    apiGet<{ total: number; entries: OverallRatingEntry[] }>('/public/ratings/overall'),
};

export const tournamentsApi = {
  nearest: () => apiGet<Tournament | null>('/tournaments/nearest'),
  list: () => apiGet<Tournament[]>('/tournaments'),
  byId: (id: string) => apiGet<Tournament>(`/tournaments/${id}`),
  register: (tournamentId: string) => apiPost<Registration>('/registrations', { tournamentId }),
};

export const ratingApi = {
  monthly: (mode: 'current' | 'previous' = 'current') =>
    apiGet<MonthlyRatingResponse>(`/ratings/monthly?month=${mode}`),
  overall: () => apiGet<OverallRatingEntry[]>('/ratings'),
};
