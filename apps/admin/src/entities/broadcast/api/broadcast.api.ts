import type {
  BroadcastButtons,
  BroadcastCampaignDetailsDto,
  BroadcastCampaignDto,
  BroadcastCustomButton,
  BroadcastSegment,
  BroadcastSegmentPreviewDto,
} from '@gutshot/types';
import { apiClient } from '../../../shared/api/client';

export interface CreateBroadcastInput {
  title: string;
  bodyHtml: string;
  segment: BroadcastSegment;
  tournamentId?: string;
  targetUserId?: string;
  photoUrl?: string;
  buttons?: BroadcastButtons;
  customButtons?: BroadcastCustomButton[];
}

export interface UpdateBroadcastInput {
  title?: string;
  bodyHtml?: string;
  segment?: BroadcastSegment;
  tournamentId?: string | null;
  targetUserId?: string | null;
  photoUrl?: string | null;
  buttons?: BroadcastButtons;
  customButtons?: BroadcastCustomButton[] | null;
}

export const adminBroadcastApi = {
  async list(): Promise<BroadcastCampaignDto[]> {
    const { data } = await apiClient.get('/admin/broadcasts');
    return data.data;
  },

  async getById(id: string): Promise<BroadcastCampaignDetailsDto> {
    const { data } = await apiClient.get(`/admin/broadcasts/${id}`);
    return data.data;
  },

  async preview(
    segment: BroadcastSegment,
    tournamentId?: string,
    targetUserId?: string,
  ): Promise<BroadcastSegmentPreviewDto> {
    const { data } = await apiClient.get('/admin/broadcasts/preview', {
      params: { segment, tournamentId, targetUserId },
    });
    return data.data;
  },

  async create(input: CreateBroadcastInput): Promise<BroadcastCampaignDto> {
    const { data } = await apiClient.post('/admin/broadcasts', input);
    return data.data;
  },

  async update(id: string, input: UpdateBroadcastInput): Promise<BroadcastCampaignDto> {
    const { data } = await apiClient.patch(`/admin/broadcasts/${id}`, input);
    return data.data;
  },

  async test(id: string, telegramId: string): Promise<{ ok: boolean; messageId: number }> {
    const { data } = await apiClient.post(`/admin/broadcasts/${id}/test`, { telegramId });
    return data.data;
  },

  async send(id: string): Promise<BroadcastCampaignDto> {
    const { data } = await apiClient.post(`/admin/broadcasts/${id}/send`);
    return data.data;
  },

  async deleteMessages(id: string): Promise<{ deleted: number; failed: number }> {
    const { data } = await apiClient.post(`/admin/broadcasts/${id}/delete-messages`);
    return data.data;
  },

  async removeDraft(id: string): Promise<{ ok: boolean }> {
    const { data } = await apiClient.delete(`/admin/broadcasts/${id}`);
    return data.data;
  },
};
