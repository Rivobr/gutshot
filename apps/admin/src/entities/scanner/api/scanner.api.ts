import type { ScannedPlayerDto, ScannerEventResultDto, ScannerEventType } from '@gutshot/types';
import { apiClient } from '../../../shared/api/client';

export const scannerApi = {
  async findPlayer(qrCode: string): Promise<ScannedPlayerDto> {
    const { data } = await apiClient.get(`/admin/scanner/player/${encodeURIComponent(qrCode)}`);
    return data.data;
  },
  async applyEvent(payload: {
    qrCode: string;
    event: ScannerEventType;
    tournamentId?: string;
  }): Promise<ScannerEventResultDto> {
    const { data } = await apiClient.post('/admin/scanner/event', payload);
    return data.data;
  },
};
