import type {
  LevelThresholdDto,
  MonthCloseResultDto,
  RatingRewardPayoutDto,
  XpConfigDto,
  XpSettingDto,
} from '@gutshot/types';
import { apiClient } from '../../../shared/api/client';

export const xpConfigApi = {
  async get(): Promise<XpConfigDto> {
    const { data } = await apiClient.get('/admin/xp-settings');
    return data.data;
  },
  async updateSettings(settings: XpSettingDto[]): Promise<XpSettingDto[]> {
    const { data } = await apiClient.put('/admin/xp-settings', { settings });
    return data.data;
  },
  async updateLevels(levels: LevelThresholdDto[]): Promise<LevelThresholdDto[]> {
    const { data } = await apiClient.put('/admin/xp-settings/levels', { levels });
    return data.data;
  },
  async closeMonth(payload?: {
    monthKey?: string;
    rebuild?: boolean;
  }): Promise<MonthCloseResultDto> {
    const { data } = await apiClient.post('/admin/rating-rewards/close-month', payload ?? {});
    return data.data;
  },
  async payoutRatingRewards(period: 'monthly'): Promise<RatingRewardPayoutDto> {
    const { data } = await apiClient.post(`/admin/rating-rewards/${period}`);
    return data.data;
  },
};
