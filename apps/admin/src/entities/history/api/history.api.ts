import type { PlayerEventDto, PlayerEventType } from '@gutshot/types';
import { apiClient } from '../../../shared/api/client';

export interface HistoryQuery {
  userId?: string;
  tournamentId?: string;
  type?: PlayerEventType;
  take?: number;
  skip?: number;
}

export interface HistoryPage {
  items: PlayerEventDto[];
  total: number;
}

export const adminHistoryApi = {
  async find(query: HistoryQuery): Promise<HistoryPage> {
    const { data } = await apiClient.get('/admin/history', { params: query });
    return data.data;
  },
};
