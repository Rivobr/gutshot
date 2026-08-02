import {
  AchievementDto,
  AchievementTextDto,
  LegalDocumentDto,
  NotificationDto,
  PlayerEventDto,
  PlayerProfileDto,
  Registration,
} from '@gutshot/types';
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
  async updateNickname(nickname: string): Promise<PlayerProfileDto> {
    const { data } = await apiClient.patch('/profile', { nickname });
    return data.data;
  },
  async getQrCode(): Promise<{ qrCode: string }> {
    const { data } = await apiClient.get('/profile/qr');
    return data.data;
  },
  async getEvents(): Promise<PlayerEventDto[]> {
    const { data } = await apiClient.get('/profile/events', { params: { take: 50 } });
    return data.data;
  },
  async getAchievements(): Promise<AchievementDto[]> {
    const { data } = await apiClient.get('/profile/achievements');
    return data.data;
  },
  async acceptConsent(): Promise<{ consentAcceptedAt: string }> {
    // Явно шлём {} — пустой POST с Content-Type JSON даёт 400 на Nest.
    const { data } = await apiClient.post('/profile/consent', {});
    return data.data;
  },
  async getLegalDocuments(): Promise<LegalDocumentDto[]> {
    const { data } = await apiClient.get('/legal-documents');
    return data.data;
  },
  async getAchievementTexts(): Promise<AchievementTextDto[]> {
    const { data } = await apiClient.get('/achievement-texts');
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
