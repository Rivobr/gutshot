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
  XP_PLACE_BAND_ORDER,
  XP_REWARD_SETTING_ORDER,
  XP_SETTING_LABELS,
  XP_SETTING_ORDER,
  formatPoints,
} from '../../shared/lib/event-labels';
import { useCloseRatingWeek, useRatingRewardPayout } from '../../entities/xp-config';

export function XpSettingsPage(): JSX.Element {
  const { data, isLoading } = useXpConfig();
  const updateSettings = useUpdateXpSettings();
  const updateLevels = useUpdateLevels();
  const closeWeek = useCloseRatingWeek();
  const payoutWeekly = useRatingRewardPayout('weekly');
  const payoutMonthly = useRatingRewardPayout('monthly');

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
        <h1 className="text-2xl font-medium">XP и уровни</h1>
        <p className="text-sm text-muted-foreground">
          Модель 250 000 XP → 100 уровень: места в ежедневном турнире, уровни, неделя и финал
          месяца. Новые значения не пересчитывают уже начисленное.
        </p>
      </div>

      <Card className="gap-4">
        <div>
          <h2 className="font-medium">XP за места в турнире (1–30)</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Места 31+ настраиваются отдельными диапазонами ниже. Минимум за участие — 100 XP. Сумма
            топ-30 при полной таблице:{' '}
            <span className="text-foreground">{formatPoints(scale.totalPoints)}</span> XP.
          </p>
        </div>

        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40 text-left text-muted-foreground">
                <th className="px-3 py-2.5 font-medium">Место</th>
                <th className="px-3 py-2.5 font-medium">XP</th>
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
                      onChange={(event) => setPlacePoints(row.place, Number(event.target.value))}
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

        <div className="grid gap-3 sm:grid-cols-3">
          {XP_PLACE_BAND_ORDER.map((key) => (
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
      </Card>

      <Card className="gap-4">
        <div>
          <h2 className="font-medium">Рейтинг: неделя → финал месяца</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            За неделю идут ежедневные турниры. В конце недели нажмите «Закрыть неделю» — топ-7
            переносят свои очки в финал месяца. Так 4 недели. В финале у игрока сумма очков всех
            недель, где он был в топ-7.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => closeWeek.mutate({ target: 'previous' })}
            isLoading={closeWeek.isPending}
          >
            Закрыть прошлую неделю (топ-7 → финал)
          </Button>
          {closeWeek.isSuccess && (
            <span className="text-sm text-primary">
              {closeWeek.data?.weekKey}: {closeWeek.data?.alreadyClosed ? 'уже закрыта' : 'закрыта'}
              , финалистов {closeWeek.data?.qualified.length ?? 0}
            </span>
          )}
          {closeWeek.isError && (
            <span className="text-sm text-destructive">
              Не удалось закрыть неделю — дождитесь окончания недели
            </span>
          )}
        </div>

        <div>
          <h3 className="font-medium">XP-награды топ-3</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Отдельно от квалификации: начисление XP за 1–3 место недели / финала. Повторный запуск
            за тот же период ничего не задвоит.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {XP_REWARD_SETTING_ORDER.map((key: XpSettingKey) => (
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

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => payoutWeekly.mutate()}
            isLoading={payoutWeekly.isPending}
          >
            Выплатить XP за неделю
          </Button>
          <Button
            variant="ghost"
            onClick={() => payoutMonthly.mutate()}
            isLoading={payoutMonthly.isPending}
          >
            Выплатить XP за финал месяца
          </Button>
          {payoutWeekly.isSuccess && (
            <span className="text-sm text-primary">
              Неделя: начислено {payoutWeekly.data?.awarded.length ?? 0}, пропущено{' '}
              {payoutWeekly.data?.skipped ?? 0}
            </span>
          )}
          {payoutMonthly.isSuccess && (
            <span className="text-sm text-primary">
              Месяц: начислено {payoutMonthly.data?.awarded.length ?? 0}, пропущено{' '}
              {payoutMonthly.data?.skipped ?? 0}
            </span>
          )}
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
          <h2 className="font-medium">Уровни 1–100</h2>
          <p className="text-sm text-muted-foreground">
            Накопительный XP для каждого уровня. По ТЗ: 10 ур. — 4 410, 50 ур. — 104 410, 100 ур. —
            481 910 XP. Уровни игроков пересчитываются автоматически.
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
