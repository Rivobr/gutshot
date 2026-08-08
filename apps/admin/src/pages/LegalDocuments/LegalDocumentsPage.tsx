import { useEffect, useState } from 'react';
import type { LegalDocumentDto, LegalDocumentType } from '@gutshot/types';
import { Button, Card, Loader } from '@gutshot/ui';
import { useLegalDocuments, useSaveLegalDocument } from '../../entities/legal-document';
import { formatDateTime } from '../../shared/lib/event-labels';

const DOCUMENT_ORDER: LegalDocumentType[] = [
  'CLUB_RULES',
  'USER_AGREEMENT',
  'PERSONAL_DATA_CONSENT',
  'MEDIA_CONSENT',
];

const DOCUMENT_LABELS: Record<LegalDocumentType, string> = {
  CLUB_RULES: 'Правила клуба',
  USER_AGREEMENT: 'Пользовательское соглашение',
  PERSONAL_DATA_CONSENT: 'Обработка персональных данных',
  MEDIA_CONSENT: 'Фото- и видеосъёмка',
};

export function LegalDocumentsPage(): JSX.Element {
  const { data, isLoading } = useLegalDocuments();
  const saveDocument = useSaveLegalDocument();

  const [activeType, setActiveType] = useState<LegalDocumentType>('CLUB_RULES');
  const [draft, setDraft] = useState<{ title: string; content: string }>({
    title: '',
    content: '',
  });

  const documents = new Map<LegalDocumentType, LegalDocumentDto>(
    (data ?? []).map((document) => [document.type, document]),
  );
  const active = documents.get(activeType);

  useEffect(() => {
    if (active) {
      setDraft({ title: active.title, content: active.content });
    }
  }, [active?.type, active?.version]);

  if (isLoading) {
    return <Loader />;
  }

  const isDirty = !!active && (draft.title !== active.title || draft.content !== active.content);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-medium">Документы</h1>
        <p className="text-sm text-muted-foreground">
          Тексты хранятся в базе и сразу отображаются в Mini App. «Правила клуба» — страница
          «Правила» у игроков.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {DOCUMENT_ORDER.map((type) => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              type === activeType
                ? 'bg-primary text-primary-foreground'
                : 'border border-border text-secondary-foreground hover:bg-secondary'
            }`}
          >
            {DOCUMENT_LABELS[type]}
          </button>
        ))}
      </div>

      <Card className="gap-4">
        {active ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm text-muted-foreground">
                Версия {active.version} · обновлено {formatDateTime(active.updatedAt)}
              </span>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-muted-foreground">Заголовок</span>
              <input
                value={draft.title}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, title: event.target.value }))
                }
                className="rounded-md border border-border bg-secondary px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-muted-foreground">Текст документа</span>
              <textarea
                value={draft.content}
                rows={18}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, content: event.target.value }))
                }
                className="rounded-md border border-border bg-secondary px-3 py-2.5 font-mono text-sm leading-relaxed outline-none focus:ring-2 focus:ring-primary"
              />
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                disabled={!isDirty || !draft.title.trim() || !draft.content.trim()}
                isLoading={saveDocument.isPending}
                onClick={() =>
                  saveDocument.mutate({
                    type: activeType,
                    title: draft.title.trim(),
                    content: draft.content,
                  })
                }
              >
                Сохранить
              </Button>
              <Button
                variant="ghost"
                disabled={!isDirty}
                onClick={() => setDraft({ title: active.title, content: active.content })}
              >
                Отменить изменения
              </Button>
              {saveDocument.isSuccess && !isDirty && (
                <span className="text-sm text-primary">Опубликовано</span>
              )}
              {saveDocument.isError && (
                <span className="text-sm text-destructive">Не удалось сохранить</span>
              )}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Документ не найден</p>
        )}
      </Card>
    </div>
  );
}
