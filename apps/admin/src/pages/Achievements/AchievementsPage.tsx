import { useEffect, useState } from 'react';
import type { AchievementTextDto, AchievementTextId } from '@gutshot/types';
import { Button, Card, Loader } from '@gutshot/ui';
import {
  useAchievementTexts,
  useSaveAchievementText,
} from '../../entities/achievement-text';
import { formatDateTime } from '../../shared/lib/event-labels';

type Draft = {
  icon: string;
  title: string;
  description: string;
  howTo: string;
};

export function AchievementsAdminPage(): JSX.Element {
  const { data, isLoading } = useAchievementTexts();
  const saveText = useSaveAchievementText();

  const [activeId, setActiveId] = useState<AchievementTextId | null>(null);
  const [draft, setDraft] = useState<Draft>({
    icon: '',
    title: '',
    description: '',
    howTo: '',
  });

  const items = data ?? [];
  const active: AchievementTextDto | undefined =
    items.find((item) => item.id === activeId) ?? items[0];

  useEffect(() => {
    if (!activeId && items[0]) {
      setActiveId(items[0].id);
    }
  }, [activeId, items]);

  useEffect(() => {
    if (active) {
      setDraft({
        icon: active.icon,
        title: active.title,
        description: active.description,
        howTo: active.howTo,
      });
    }
  }, [active?.id, active?.updatedAt]);

  if (isLoading) {
    return <Loader />;
  }

  if (!active) {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-medium">Достижения</h1>
        <p className="text-sm text-muted-foreground">
          Тексты ещё не загружены. Перезапустите API после миграции.
        </p>
      </div>
    );
  }

  const isDirty =
    draft.icon !== active.icon ||
    draft.title !== active.title ||
    draft.description !== active.description ||
    draft.howTo !== active.howTo;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-medium">Достижения</h1>
        <p className="text-sm text-muted-foreground">
          Название, описание и инструкция «Как получить» — сразу в Mini App
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveId(item.id)}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              active.id === item.id
                ? 'bg-primary text-primary-foreground'
                : 'border border-border text-secondary-foreground hover:bg-secondary'
            }`}
          >
            <span className="mr-1.5">{item.icon}</span>
            {item.title}
          </button>
        ))}
      </div>

      <Card className="gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">
            id: {active.id} · обновлено {formatDateTime(active.updatedAt)}
          </span>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-muted-foreground">Иконка (emoji)</span>
          <input
            value={draft.icon}
            onChange={(event) =>
              setDraft((current) => ({ ...current, icon: event.target.value }))
            }
            className="max-w-[120px] rounded-md border border-border bg-secondary px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-muted-foreground">Название</span>
          <input
            value={draft.title}
            onChange={(event) =>
              setDraft((current) => ({ ...current, title: event.target.value }))
            }
            className="rounded-md border border-border bg-secondary px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-muted-foreground">Краткое описание</span>
          <textarea
            value={draft.description}
            rows={3}
            onChange={(event) =>
              setDraft((current) => ({ ...current, description: event.target.value }))
            }
            className="rounded-md border border-border bg-secondary px-3 py-2.5 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-primary"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-muted-foreground">Как получить</span>
          <textarea
            value={draft.howTo}
            rows={8}
            onChange={(event) =>
              setDraft((current) => ({ ...current, howTo: event.target.value }))
            }
            className="rounded-md border border-border bg-secondary px-3 py-2.5 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-primary"
          />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            disabled={
              !isDirty ||
              !draft.icon.trim() ||
              !draft.title.trim() ||
              !draft.description.trim() ||
              !draft.howTo.trim()
            }
            isLoading={saveText.isPending}
            onClick={() =>
              saveText.mutate({
                id: active.id,
                icon: draft.icon.trim(),
                title: draft.title.trim(),
                description: draft.description.trim(),
                howTo: draft.howTo.trim(),
              })
            }
          >
            Сохранить
          </Button>
          <Button
            variant="ghost"
            disabled={!isDirty}
            onClick={() =>
              setDraft({
                icon: active.icon,
                title: active.title,
                description: active.description,
                howTo: active.howTo,
              })
            }
          >
            Отменить
          </Button>
          {saveText.isSuccess && !isDirty && (
            <span className="text-sm text-muted-foreground">Сохранено</span>
          )}
          {saveText.isError && (
            <span className="text-sm text-destructive">Не удалось сохранить</span>
          )}
        </div>
      </Card>
    </div>
  );
}
