import { PlayerProfileDto, NotificationDto, Registration } from '@gutshot/types';
import { apiClient } from '../../../shared/api/client';

export interface XPHistoryDto {
  id: string;
  amount: number;
  reason: string;
  createdAt: string;
}

export const playerApi = {
  async getProfile(): Promise<PlayerProfileDto> {
    const { data } = await apiClient.get('/profile');
    return data.data;
  },
  async getXpHistory(): Promise<XPHistoryDto[]> {
    const { data } = await apiClient.get('/profile/history');
    return data.data;
  },
  async getTournamentHistory(): Promise<Registration[]> {
    const { data } = await apiClient.get('/profile/tournaments');
    return data.data;
  },
  async getNotifications(): Promise<NotificationDto[]> {
    const { data } = await apiClient.get('/notifications');
    return data.data;
  },
};
