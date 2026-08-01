import { useEffect, useMemo, useState } from 'react';
import {
  PLACE_RATING_KEY_BY_PLACE,
  buildPlaceRatingScale,
  type LevelThresholdDto,
  type XpSettingKey,
} from '@gutshot/types';
import { Button, Card, Loader } from '@gutshot/ui';
import { useUpdateLevels, useUpdateXpSettings, useXpConfig } from '../../entities/xp-config';
import {
  XP_EVENT_SETTING_ORDER,
  XP_SETTING_LABELS,
  XP_SETTING_ORDER,
  formatPoints,
} from '../../shared/lib/event-labels';

export function XpSettingsPage(): JSX.Element {
  const { data, isLoading } = useXpConfig();
  const updateSettings = useUpdateXpSettings();
  const updateLevels = useUpdateLevels();

  const [values, setValues] = useState<Record<string, number>>({});
  const [levels, setLevels] = useState<LevelThresholdDto[]>([]);
  const [levelsError, setLevelsError] = useState<string | null>(null);

  useEffect(() => {
    if (!data) {
      return;
    }

    setValues(Object.fromEntries(data.settings.map((item) => [item.key, item.value])));
    setLevels(data.levels);
  }, [data]);

  const scale = useMemo(
    () => buildPlaceRatingScale(values as Partial<Record<XpSettingKey, number>>),
    [values],
  );

  if (isLoading || !data) {
    return <Loader />;
  }

  const saveSettings = () => {
    updateSettings.mutate(
      XP_SETTING_ORDER.map((key) => ({ key, value: Number(values[key] ?? 0) })),
    );
  };

  const saveLevels = () => {
    const sorted = [...levels].sort((a, b) => a.level - b.level);

    if (sorted.length === 0 || sorted[0].level !== 1 || sorted[0].requiredXp !== 0) {
      setLevelsError('Первый уровень должен начинаться с 0 XP');
      return;
    }

    for (let i = 1; i < sorted.length; i += 1) {
      if (sorted[i].requiredXp <= sorted[i - 1].requiredXp) {
        setLevelsError(
          `Порог уровня ${sorted[i].level} должен быть больше порога уровня ${sorted[i - 1].level}`,
        );
        return;
      }
    }

    setLevelsError(null);
    updateLevels.mutate(sorted);
  };

  const updateLevelField = (level: number, patch: Partial<LevelThresholdDto>) => {
    setLevels((current) =>
      current.map((item) => (item.level === level ? { ...item, ...patch } : item)),
    );
  };

  const addLevel = () => {
    const last = [...levels].sort((a, b) => a.level - b.level).at(-1);
    setLevels((current) => [
      ...current,
      {
        level: (last?.level ?? 0) + 1,
        requiredXp: (last?.requiredXp ?? 0) + 500,
        title: null,
      },
    ]);
  };

  const setPlacePoints = (place: number, points: number) => {
    const key = PLACE_RATING_KEY_BY_PLACE[place];
    if (!key) {
      return;
    }
    setValues((current) => ({ ...current, [key]: points }));
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-medium">Очки и XP</h1>
        <p className="text-sm text-muted-foreground">
          Очки — рейтинг (места в турнирах). XP — уровень игрока (явка, комбо и т.д.). Новые значения
          не пересчитывают уже начисленное.
        </p>
      </div>

      <Card className="gap-4">
        <div>
          <h2 className="font-medium">Шкала рейтинга — очки (места 1–20)</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Очки за место в турнире. 1 место — премия за победу; со 2 по 20 — плавное снижение.
            Всего за турнир при полной таблице:{' '}
            <span className="text-foreground">{formatPoints(scale.totalPoints)}</span> очков.
          </p>
        </div>

        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40 text-left text-muted-foreground">
                <th className="px-3 py-2.5 font-medium">Место</th>
                <th className="px-3 py-2.5 font-medium">Очки</th>
                <th className="px-3 py-2.5 font-medium">Разница с предыдущим</th>
              </tr>
            </thead>
            <tbody>
              {scale.rows.map((row) => (
                <tr key={row.place} className="border-b border-border/60">
                  <td className="px-3 py-2 font-medium">{row.place}</td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      value={values[PLACE_RATING_KEY_BY_PLACE[row.place]] ?? 0}
                      onChange={(event) =>
                        setPlacePoints(row.place, Number(event.target.value))
                      }
                      className="w-28 rounded-md border border-border bg-secondary px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-primary"
                    />
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {row.diff === null ? '—' : formatPoints(row.diff)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="gap-4">
        <h2 className="font-medium">Прочие начисления (XP уровня)</h2>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {XP_EVENT_SETTING_ORDER.map((key: XpSettingKey) => (
            <label key={key} className="flex flex-col gap-1.5">
              <span className="text-sm text-muted-foreground">{XP_SETTING_LABELS[key]}</span>
              <input
                type="number"
                min={0}
                value={values[key] ?? 0}
                onChange={(event) =>
                  setValues((current) => ({ ...current, [key]: Number(event.target.value) }))
                }
                className="rounded-md border border-border bg-secondary px-3 py-2.5 text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={saveSettings} isLoading={updateSettings.isPending}>
            Сохранить значения
          </Button>
          {updateSettings.isSuccess && <span className="text-sm text-primary">Сохранено</span>}
          {updateSettings.isError && (
            <span className="text-sm text-destructive">Не удалось сохранить</span>
          )}
        </div>
      </Card>

      <Card className="gap-4">
        <div>
          <h2 className="font-medium">Уровни</h2>
          <p className="text-sm text-muted-foreground">
            Пороги XP для каждого уровня. Уровни игроков пересчитываются автоматически.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[...levels]
            .sort((a, b) => a.level - b.level)
            .map((item) => (
              <div
                key={item.level}
                className="flex items-center gap-2 rounded-md border border-border px-3 py-2"
              >
                <span className="w-16 shrink-0 text-sm text-muted-foreground">
                  Ур. {item.level}
                </span>
                <input
                  type="number"
                  min={0}
                  value={item.requiredXp}
                  disabled={item.level === 1}
                  onChange={(event) =>
                    updateLevelField(item.level, { requiredXp: Number(event.target.value) })
                  }
                  className="w-full rounded-md border border-border bg-secondary px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                />
                <span className="shrink-0 text-xs text-muted-foreground">XP</span>
              </div>
            ))}
        </div>

        {levelsError && <p className="text-sm text-destructive">{levelsError}</p>}

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={saveLevels} isLoading={updateLevels.isPending}>
            Сохранить уровни
          </Button>
          <Button variant="ghost" onClick={addLevel}>
            + Добавить уровень
          </Button>
          {updateLevels.isSuccess && <span className="text-sm text-primary">Сохранено</span>}
          {updateLevels.isError && (
            <span className="text-sm text-destructive">Не удалось сохранить</span>
          )}
        </div>
      </Card>
    </div>
  );
}
