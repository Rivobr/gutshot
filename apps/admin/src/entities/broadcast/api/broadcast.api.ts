import type {
  BroadcastCampaignDetailsDto,
  BroadcastCampaignDto,
  BroadcastSegment,
  BroadcastSegmentPreviewDto,
} from '@gutshot/types';
import { apiClient } from '../../../shared/api/client';
import { env } from '../../../shared/config/env';

export interface CreateBroadcastInput {
  title: string;
  bodyHtml: string;
  segment: BroadcastSegment;
  targetTelegramId?: string | null;
  photoPath?: string | null;
}

export interface UpdateBroadcastInput {
  title?: string;
  bodyHtml?: string;
  segment?: BroadcastSegment;
  targetTelegramId?: string | null;
  photoPath?: string | null;
}

/** Абсолютный URL превью загруженного фото (статика API). */
export function broadcastPhotoUrl(photoPath: string): string {
  const base = env.apiUrl.replace(/\/$/, '');
  return `${base}/uploads/${photoPath.replace(/^\//, '')}`;
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
    targetTelegramId?: string,
  ): Promise<BroadcastSegmentPreviewDto> {
    const { data } = await apiClient.get('/admin/broadcasts/preview', {
      params: { segment, targetTelegramId: targetTelegramId || undefined },
    });
    return data.data;
  },

  async uploadPhoto(file: File): Promise<{ photoPath: string }> {
    const form = new FormData();
    form.append('photo', file);
    const { data } = await apiClient.post('/admin/broadcasts/photo', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
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

  async send(id: string): Promise<BroadcastCampaignDto> {
    const { data } = await apiClient.post(`/admin/broadcasts/${id}/send`);
    return data.data;
  },

  async deleteMessages(id: string): Promise<{ deleted: number; failed: number }> {
    const { data } = await apiClient.post(`/admin/broadcasts/${id}/delete-messages`);
    return data.data;
  },

  async deleteMessage(
    id: string,
    deliveryId: string,
  ): Promise<{ ok: boolean; telegramMessageId: number | null }> {
    const { data } = await apiClient.delete(`/admin/broadcasts/${id}/messages/${deliveryId}`);
    return data.data;
  },

  async removeDraft(id: string): Promise<{ ok: boolean }> {
    const { data } = await apiClient.delete(`/admin/broadcasts/${id}`);
    return data.data;
  },
};
