import type { LevelThresholdDto, XpConfigDto, XpSettingDto } from '@gutshot/types';
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
};
