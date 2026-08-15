import type { LegalDocumentDto, LegalDocumentType } from '@gutshot/types';

function pages(folder: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => {
    const n = String(index + 1).padStart(2, '0');
    return `/legal/${folder}/${n}.jpg`;
  });
}

/** Сканы юридических документов. Ключ — слот из админки. */
export const LEGAL_DOCUMENT_PAGES: Partial<Record<LegalDocumentType, string[]>> = {
  USER_AGREEMENT: pages('offer', 7),
  PERSONAL_DATA_CONSENT: pages('privacy', 8),
};

export const LEGAL_DOCUMENT_TITLES: Partial<Record<LegalDocumentType, string>> = {
  USER_AGREEMENT: 'Публичная оферта',
  PERSONAL_DATA_CONSENT: 'Политика обработки персональных данных',
};

export function resolveLegalDocument(
  type: LegalDocumentType,
  fromApi?: LegalDocumentDto | null,
): LegalDocumentDto {
  return {
    type,
    title: LEGAL_DOCUMENT_TITLES[type] ?? fromApi?.title ?? type,
    content: fromApi?.content ?? '',
    version: fromApi?.version ?? 0,
    updatedAt: fromApi?.updatedAt ?? new Date(0).toISOString(),
  };
}
