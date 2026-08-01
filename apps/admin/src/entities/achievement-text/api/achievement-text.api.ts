import type { AchievementTextDto, AchievementTextId } from '@gutshot/types';
import { apiClient } from '../../../shared/api/client';

export const achievementTextsApi = {
  async getAll(): Promise<AchievementTextDto[]> {
    const { data } = await apiClient.get('/admin/achievement-texts');
    return data.data;
  },
  async save(
    id: AchievementTextId,
    payload: { icon: string; title: string; description: string; howTo: string },
  ): Promise<AchievementTextDto> {
    const { data } = await apiClient.put(`/admin/achievement-texts/${id}`, payload);
    return data.data;
  },
};
