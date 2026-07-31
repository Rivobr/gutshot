import type { LegalDocumentDto, LegalDocumentType } from '@gutshot/types';
import { apiClient } from '../../../shared/api/client';

export const legalDocumentsApi = {
  async getAll(): Promise<LegalDocumentDto[]> {
    const { data } = await apiClient.get('/admin/legal-documents');
    return data.data;
  },
  async save(
    type: LegalDocumentType,
    payload: { title: string; content: string },
  ): Promise<LegalDocumentDto> {
    const { data } = await apiClient.put(`/admin/legal-documents/${type}`, payload);
    return data.data;
  },
};
