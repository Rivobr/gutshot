import { useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import { RE_ENTRY_KINDS, type ReEntryKindType } from '@gutshot/types';
import { Button, Card, Loader } from '@gutshot/ui';
import {
  useAnalyticsReEntries,
  useAnalyticsShifts,
  useCreateShift,
  useDeleteShift,
} from '../../entities/analytics';
import { showToast } from '../../shared/ui/toast';

type Tab = 'shifts' | 're-entries';

/** Текущий месяц в формате YYYY-MM (локальное время). */
function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/** YYYY-MM → «Сентябрь 2026». */
function monthTitle(month: string): string {
  const [year, monthIdx] = month.split('-').map(Number);
  const titles = [
    'Январь',
    'Февраль',
    'Март',
    'Апрель',
    'Май',
    'Июнь',
    'Июль',
    'Август',
    'Сентябрь',
    'Октябрь',
    'Ноябрь',
    'Декабрь',
  ];
  return `${titles[(monthIdx ?? 1) - 1] ?? month} ${year}`;
}

/** YYYY-MM → соседний месяц. */
function shiftMonth(month: string, delta: number): string {
  const [year, monthIdx] = month.split('-').map(Number);
  const date = new Date(year, monthIdx - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function formatMoney(value: number): string {
  return `${value.toLocaleString('ru-RU')} ₽`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function apiErrorMessage(error: unknown, fallback: string): string {
  return (
    (isAxiosError(error)
      ? (error.response?.data as { message?: string } | undefined)?.message
      : undefined) ?? fallback
  );
}

export function AnalyticsPage(): JSX.Element {
  const [month, setMonth] = useState(currentMonth());
  const [tab, setTab] = useState<Tab>('shifts');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-medium sm:text-2xl">Аналитика</h1>
        <MonthSwitcher month={month} onChange={setMonth} />
      </div>

      <div className="flex gap-2">
        <TabButton active={tab === 'shifts'} onClick={() => setTab('shifts')}>
          Смены
        </TabButton>
        <TabButton active={tab === 're-entries'} onClick={() => setTab('re-entries')}>
          Реентры и аддоны
        </TabButton>
      </div>

      {tab === 'shifts' ? <ShiftsSection month={month} /> : <ReEntriesSection month={month} />}
    </div>
  );
}

function MonthSwitcher({
  month,
  onChange,
}: {
  month: string;
  onChange: (month: string) => void;
}): JSX.Element {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="secondary"
        className="px-3 py-1.5"
        onClick={() => onChange(shiftMonth(month, -1))}
      >
        ←
      </Button>
      <span className="min-w-36 text-center text-sm font-medium">{monthTitle(month)}</span>
      <Button
        variant="secondary"
        className="px-3 py-1.5"
        onClick={() => onChange(shiftMonth(month, 1))}
      >
        →
      </Button>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? 'rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground'
          : 'rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/70'
      }
    >
      {children}
    </button>
  );
}

/* ---------------------------------- Смены ---------------------------------- */

function ShiftsSection({ month }: { month: string }): JSX.Element {
  const { data, isLoading, isError } = useAnalyticsShifts(month);
  const createShift = useCreateShift();
  const deleteShift = useDeleteShift();

  const [name, setName] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const canSubmit = name.trim().length > 0 && date.length > 0 && !createShift.isPending;

  const handleSubmit = () => {
    if (!name.trim()) {
      showToast('Укажите имя сотрудника', 'error');
      return;
    }
    const amountValue = Number(amount);
    if (!Number.isFinite(amountValue) || amount === '') {
      showToast('Укажите сумму за день', 'error');
      return;
    }
    createShift.mutate(
      {
        name: name.trim(),
        date: new Date(`${date}T12:00:00`).toISOString(),
        amount: Math.round(amountValue),
        note: note.trim() || undefined,
      },
      {
        onSuccess: () => {
          setName('');
          setNote('');
          setAmount('');
          showToast('Смена добавлена', 'success');
        },
        onError: (error) => {
          const message = isAxiosError(error)
            ? (error.response?.data as { message?: string } | undefined)?.message
            : undefined;
          showToast(message?.trim() || 'Не удалось добавить смену', 'error');
        },
      },
    );
  };

  if (isLoading) {
    return <Loader />;
  }

  if (isError || !data) {
    return (
      <Card>
        <p className="text-sm text-destructive">Не удалось загрузить смены за месяц.</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <p className="text-sm text-muted-foreground">Итог за месяц</p>
          <p className="text-2xl font-medium text-primary">{formatMoney(data.total)}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Записей за месяц</p>
          <p className="text-2xl font-medium">{data.entries.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Сотрудников</p>
          <p className="text-2xl font-medium">{data.byName.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Лучший по сумме</p>
          <p className="truncate text-lg font-medium">
            {data.byName[0] ? `${data.byName[0].name} · ${formatMoney(data.byName[0].total)}` : '—'}
          </p>
        </Card>
      </div>

      <Card className="gap-3">
        <h2 className="font-medium">Добавить смену</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Имя"
            className="rounded-md border border-border bg-secondary px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="rounded-md border border-border bg-secondary px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="number"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="Сумма, ₽"
            className="rounded-md border border-border bg-secondary px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Комментарий"
            className="rounded-md border border-border bg-secondary px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          <Button onClick={handleSubmit} disabled={createShift.isPending}>
            {createShift.isPending ? 'Добавляем…' : 'Добавить'}
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="gap-3 lg:col-span-2">
          <h2 className="font-medium">Смены за {monthTitle(data.month)}</h2>
          {data.entries.length === 0 ? (
            <p className="rounded-md border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
              За этот месяц смен пока нет.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Дата</th>
                    <th className="py-2 pr-3 font-medium">Имя</th>
                    <th className="py-2 pr-3 font-medium">Комментарий</th>
                    <th className="py-2 pr-3 font-medium">Сумма</th>
                    <th className="py-2 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {data.entries.map((entry) => (
                    <tr key={entry.id} className="border-b border-border/60">
                      <td className="py-2.5 pr-3 whitespace-nowrap">{formatDate(entry.date)}</td>
                      <td className="py-2.5 pr-3 font-medium">{entry.name}</td>
                      <td className="py-2.5 pr-3 text-muted-foreground">{entry.note ?? '—'}</td>
                      <td className="py-2.5 pr-3 font-medium text-primary">
                        {formatMoney(entry.amount)}
                      </td>
                      <td className="py-2.5 text-right">
                        <Button
                          variant="ghost"
                          className="px-2 py-1 text-xs text-destructive"
                          disabled={deleteShift.isPending}
                          onClick={() => {
                            deleteShift.mutate(entry.id, {
                              onSuccess: () => showToast('Запись удалена', 'success'),
                              onError: () => showToast('Не удалось удалить запись', 'error'),
                            });
                          }}
                        >
                          Удалить
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="gap-2">
          <h2 className="font-medium">Итог по сотрудникам</h2>
          {data.byName.length === 0 ? (
            <p className="text-sm text-muted-foreground">Нет данных за месяц.</p>
          ) : (
            data.byName.map((item) => (
              <div key={item.name} className="flex items-center justify-between gap-2 text-sm">
                <span className="min-w-0 truncate">
                  {item.name} <span className="text-muted-foreground">· {item.days} дн.</span>
                </span>
                <span className="shrink-0 font-medium text-primary">{formatMoney(item.total)}</span>
              </div>
            ))
          )}
          <div className="mt-2 flex justify-between border-t border-border pt-2 text-sm font-medium">
            <span>Итого за месяц</span>
            <span className="text-primary">{formatMoney(data.total)}</span>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* --------------------------------- Реентры --------------------------------- */

function ReEntriesSection({ month }: { month: string }): JSX.Element {
  const { data, isLoading, isError } = useAnalyticsReEntries(month);

  const kindRows = useMemo(() => {
    if (!data) {
      return [];
    }
    return (Object.keys(RE_ENTRY_KINDS) as ReEntryKindType[]).map((kind) => ({
      kind,
      meta: RE_ENTRY_KINDS[kind],
      ...(data.byKind[kind] ?? { count: 0, revenue: 0 }),
    }));
  }, [data]);

  if (isLoading) {
    return <Loader />;
  }

  if (isError || !data) {
    return (
      <Card>
        <p className="text-sm text-destructive">Не удалось загрузить реентры за месяц.</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <p className="text-sm text-muted-foreground">Всего за месяц</p>
          <p className="text-2xl font-medium">{data.total}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Выручка</p>
          <p className="text-2xl font-medium text-primary">{formatMoney(data.revenue)}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Ре-энтри</p>
          <p className="text-2xl font-medium">
            {(data.byKind.RE_ENTRY_1000?.count ?? 0) + (data.byKind.RE_ENTRY_1500?.count ?? 0)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Аддоны</p>
          <p className="text-2xl font-medium">{data.byKind.ADDON_1000?.count ?? 0}</p>
        </Card>
      </div>

      <Card className="gap-3">
        <h2 className="font-medium">По видам</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {kindRows.map((row) => (
            <div key={row.kind} className="rounded-md border border-border px-4 py-3">
              <p className="text-sm text-muted-foreground">{RE_ENTRY_KINDS[row.kind].label}</p>
              <p className="text-xl font-medium">{row.count} шт.</p>
              <p className="text-sm text-primary">{formatMoney(row.revenue)}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="gap-3">
        <h2 className="font-medium">По турнирам</h2>
        {data.byTournament.length === 0 ? (
          <p className="rounded-md border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
            За этот месяц реентров и аддонов не было.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Турнир</th>
                  <th className="py-2 pr-3 font-medium">Ре-энтри 30к</th>
                  <th className="py-2 pr-3 font-medium">Ре-энтри 60к</th>
                  <th className="py-2 pr-3 font-medium">Аддон</th>
                  <th className="py-2 font-medium">Выручка</th>
                </tr>
              </thead>
              <tbody>
                {data.byTournament.map((row) => (
                  <tr key={row.tournamentId} className="border-b border-border/60">
                    <td className="py-2.5 pr-3">
                      <span className="font-medium">{row.tournamentTitle}</span>{' '}
                      <span className="text-xs text-muted-foreground">
                        {formatDate(row.tournamentDate)}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3">{row.counts.RE_ENTRY_1000?.count ?? 0}</td>
                    <td className="py-2.5 pr-3">{row.counts.RE_ENTRY_1500?.count ?? 0}</td>
                    <td className="py-2.5 pr-3">{row.counts.ADDON_1000?.count ?? 0}</td>
                    <td className="py-2.5 font-medium text-primary">{formatMoney(row.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="gap-3">
        <h2 className="font-medium">Журнал</h2>
        {data.logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Записей нет.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {data.logs.map((log) => (
              <li key={log.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{log.playerName ?? 'Игрок'}</span>
                  <span className="text-xs text-muted-foreground">
                    {RE_ENTRY_KINDS[log.kind].shortLabel} · {log.tournamentTitle} ·{' '}
                    {formatDateTime(log.createdAt)}
                  </span>
                </div>
                <span className="shrink-0 font-medium text-primary">{formatMoney(log.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
