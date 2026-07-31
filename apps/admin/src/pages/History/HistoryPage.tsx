import { useState } from 'react';
import type { PlayerEventType } from '@gutshot/types';
import { Card, Loader } from '@gutshot/ui';
import { useAdminHistory } from '../../entities/history';
import { PLAYER_EVENT_LABELS, formatDateTime } from '../../shared/lib/event-labels';

const EVENT_TYPES = Object.keys(PLAYER_EVENT_LABELS) as PlayerEventType[];

export function HistoryPage(): JSX.Element {
  const [type, setType] = useState<PlayerEventType | ''>('');
  const { data, isLoading } = useAdminHistory({ type: type || undefined, take: 100 });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-medium">История событий</h1>
        <p className="text-sm text-muted-foreground">
          Все действия игроков и сотрудников клуба
        </p>
      </div>

      <Card className="gap-4">
        <label className="flex flex-col gap-1.5 sm:max-w-xs">
          <span className="text-sm text-muted-foreground">Тип события</span>
          <select
            value={type}
            onChange={(event) => setType(event.target.value as PlayerEventType | '')}
            className="rounded-md border border-border bg-secondary px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Все события</option>
            {EVENT_TYPES.map((value) => (
              <option key={value} value={value}>
                {PLAYER_EVENT_LABELS[value]}
              </option>
            ))}
          </select>
        </label>

        {isLoading ? (
          <Loader />
        ) : !data || data.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Событий не найдено</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Показано {data.items.length} из {data.total}
            </p>

            <ul className="flex flex-col divide-y divide-border">
              {data.items.map((event) => (
                <li key={event.id} className="flex items-start justify-between gap-3 py-3">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-sm font-medium">
                      {PLAYER_EVENT_LABELS[event.type]}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {event.user
                        ? `${`${event.user.firstName ?? ''} ${event.user.lastName ?? ''}`.trim() || 'Игрок'}`
                        : 'Игрок'}
                      {event.tournament ? ` · ${event.tournament.title}` : ''}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(event.createdAt)}
                      {event.performedBy ? ` · выполнил ${event.performedBy.name}` : ' · система'}
                    </span>
                  </div>

                  {event.xpAmount !== 0 && (
                    <span className="shrink-0 text-sm font-medium text-primary">
                      {event.xpAmount > 0 ? '+' : ''}
                      {event.xpAmount} XP
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </div>
  );
}
