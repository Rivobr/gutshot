import { apiGet } from '@/shared/api/client';
import type {
  PublicLandingResponse,
  PublicWeeklyRatingResponse,
  RatingEntry,
  Tournament,
  WeeklyRatingResponse,
} from '@gutshot/types';

export const publicApi = {
  landing: () => apiGet<PublicLandingResponse>('/public/landing'),
  weeklyRating: (mode: 'current' | 'previous' = 'current') =>
    apiGet<PublicWeeklyRatingResponse>(`/public/ratings/weekly?mode=${mode}`),
  finalRating: () => apiGet<{ entries: RatingEntry[] }>('/public/ratings/final'),
};

export const tournamentsApi = {
  nearest: () => apiGet<Tournament | null>('/tournaments/nearest'),
  list: () => apiGet<Tournament[]>('/tournaments'),
  byId: (id: string) => apiGet<Tournament>(`/tournaments/${id}`),
};

export const ratingApi = {
  weekly: (mode: 'current' | 'previous' = 'current') =>
    apiGet<WeeklyRatingResponse>(`/ratings/weekly?week=${mode}`),
  final: () => apiGet<RatingEntry[]>('/ratings/final'),
};
