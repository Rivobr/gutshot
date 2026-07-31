import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { LegalDocumentType } from '@gutshot/types';
import { legalDocumentsApi } from '../api/legal-document.api';

const LEGAL_DOCUMENTS_KEY = ['admin', 'legal-documents'];

export function useLegalDocuments() {
  return useQuery({ queryKey: LEGAL_DOCUMENTS_KEY, queryFn: legalDocumentsApi.getAll });
}

export function useSaveLegalDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      type,
      title,
      content,
    }: {
      type: LegalDocumentType;
      title: string;
      content: string;
    }) => legalDocumentsApi.save(type, { title, content }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LEGAL_DOCUMENTS_KEY }),
  });
}
