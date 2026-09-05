import { apiClient } from '../../../shared/api/client';

export interface AnalyticsShiftEntryDto {
  id: string;
  name: string;
  date: string;
  amount: number;
  paid: boolean;
  note: string | null;
  createdAt: string;
}

export interface AnalyticsShiftsResponseDto {
  month: string;
  entries: AnalyticsShiftEntryDto[];
  total: number;
  unpaid: number;
  paid: number;
  byName: { name: string; total: number; days: number; unpaid: number; paid: number }[];
}

export interface AnalyticsReEntryLogDto {
  id: string;
  tournamentId: string;
  tournamentTitle: string;
  kind: 'RE_ENTRY_1000' | 'RE_ENTRY_1500' | 'ADDON_1000';
  amount: number;
  chips: number;
  playerName: string | null;
  createdAt: string;
}

export interface AnalyticsReEntriesResponseDto {
  tournament?: { id: string; title: string; date: string } | null;
  month: string;
  total: number;
  revenue: number;
  byKind: Record<string, { count: number; revenue: number }>;
  byTournament: {
    tournamentId: string;
    tournamentTitle: string;
    tournamentDate: string;
    counts: Record<string, { count: number; revenue: number }>;
    revenue: number;
  }[];
  logs: AnalyticsReEntryLogDto[];
}

export interface AnalyticsSummaryResponseDto {
  month: string;
  shifts: {
    total: number;
    unpaid: number;
    paid: number;
    daysCount: number;
    byName: { name: string; total: number; days: number; unpaid: number; paid: number }[];
  };
  reEntries: {
    total: number;
    revenue: number;
    byKind: Record<string, { count: number; revenue: number }>;
  };
}

export interface ShiftEntryPayloadDto {
  name: string;
  date: string;
  amount: number;
  note?: string;
}

export const analyticsApi = {
  async summary(month?: string): Promise<AnalyticsSummaryResponseDto> {
    const { data } = await apiClient.get('/admin/analytics/summary', {
      params: month ? { month } : undefined,
    });
    return data.data;
  },
  async shifts(month?: string): Promise<AnalyticsShiftsResponseDto> {
    const { data } = await apiClient.get('/admin/analytics/shifts', {
      params: month ? { month } : undefined,
    });
    return data.data;
  },
  async createShift(payload: { name: string; date: string; amount: number; note?: string }) {
    const { data } = await apiClient.post('/admin/analytics/shifts', payload);
    return data.data;
  },
  async updateShift(
    id: string,
    payload: { name?: string; date?: string; amount?: number; note?: string },
  ) {
    const { data } = await apiClient.patch(`/admin/analytics/shifts/${id}`, payload);
    return data.data;
  },
  async setShiftPaid(id: string, paid: boolean) {
    const { data } = await apiClient.patch(`/admin/analytics/shifts/${id}/paid`, { paid });
    return data.data;
  },
  async deleteShift(id: string) {
    const { data } = await apiClient.delete(`/admin/analytics/shifts/${id}`);
    return data.data;
  },
  async reEntries(month?: string, tournamentId?: string): Promise<AnalyticsReEntriesResponseDto> {
    const { data } = await apiClient.get('/admin/analytics/re-entries', {
      params: {
        ...(month ? { month } : {}),
        ...(tournamentId ? { tournamentId } : {}),
      },
    });
    return data.data;
  },
};
