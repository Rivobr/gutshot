import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import type { AdminTournamentRegistration } from '@gutshot/types';
import { Avatar, Badge, Button, Card, Loader } from '@gutshot/ui';
import {
  useAddTournamentPlayer,
  useAdminTournament,
  useEliminatePlayer,
  useMarkAttendance,
  useSetTournamentPlace,
  useTournamentRegistrations,
  type AdminTournament,
} from '../../entities/tournament';
import { useAdminHistory } from '../../entities/history';
import { displayPlayerName } from '../../shared/lib/display-name';
import { PLAYER_EVENT_LABELS, formatDateTime } from '../../shared/lib/event-labels';
import { tournamentStatusLabel } from '../../shared/lib/tournament-status';
import { PlayerQrModal } from '../../widgets/PlayerQrModal/PlayerQrModal';
import { TournamentPlayerActionsModal } from '../../widgets/TournamentPlayerActionsModal/TournamentPlayerActionsModal';
import { TournamentActions } from './TournamentActions';
import { TournamentFormModal } from './TournamentFormModal';
import { FinishTournamentModal } from './FinishTournamentModal';

function sortRegistrations(items: AdminTournamentRegistration[]): AdminTournamentRegistration[] {
  return items.slice().sort((a, b) => {
    if (a.place != null && b.place != null) {
      return a.place - b.place;
    }
    if (a.place != null) {
      return -1;
    }
    if (b.place != null) {
      return 1;
    }
    return new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime();
  });
}

export function TournamentDetailsPage(): JSX.Element {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: tournament, isLoading } = useAdminTournament(id);
  const { data: registrations, isLoading: isRegistrationsLoading } = useTournamentRegistrations(id);
  const { data: history } = useAdminHistory({ tournamentId: id, take: 50 });
  const markAttendance = useMarkAttendance(id);
  const setPlace = useSetTournamentPlace(id);
  const eliminatePlayer = useEliminatePlayer(id);
  const addPlayer = useAddTournamentPlayer(id);

  const [isEditOpen, setEditOpen] = useState(false);
  const [isFinishOpen, setFinishOpen] = useState(false);
  const [placeDrafts, setPlaceDrafts] = useState<Record<string, string>>({});
  const [qrPlayer, setQrPlayer] = useState<AdminTournamentRegistration['user'] | null>(null);
  const [actionRegistrationId, setActionRegistrationId] = useState<string | null>(null);
  const [playerQuery, setPlayerQuery] = useState('');
  const [addMessage, setAddMessage] = useState<string | null>(null);
  const [addError, setAddError] = useState(false);

  useEffect(() => {
    if (searchParams.get('finish') === '1') {
      setFinishOpen(true);
      searchParams.delete('finish');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!registrations) {
      return;
    }
    const next: Record<string, string> = {};
    for (const registration of registrations) {
      next[registration.id] = registration.place != null ? String(registration.place) : '';
    }
    setPlaceDrafts(next);
  }, [registrations]);

  const sortedRegistrations = useMemo(
    () => sortRegistrations(registrations ?? []),
    [registrations],
  );

  const actionRegistration = useMemo(
    () => registrations?.find((item) => item.id === actionRegistrationId) ?? null,
    [registrations, actionRegistrationId],
  );

  if (isLoading || !tournament) {
    return <Loader />;
  }

  const isLive = tournament.status === 'IN_PROGRESS';
  const arrivedCount = (registrations ?? []).filter((item) => item.arrivedAt).length;
  const placedCount = (registrations ?? []).filter((item) => item.place != null).length;
  const stillInCount = (registrations ?? []).filter(
    (item) =>
      item.place == null &&
      ['REGISTERED', 'CHECKED_IN', 'PLAYING', 'FINISHED'].includes(item.status) &&
      (item.arrivedAt != null || item.status === 'PLAYING'),
  ).length;

  const savePlace = (registrationId: string) => {
    const current = registrations?.find((item) => item.id === registrationId);
    const raw = placeDrafts[registrationId]?.trim() ?? '';
    if (raw === '') {
      if (current?.place != null) {
        setPlace.mutate({ registrationId, place: null });
      }
      return;
    }
    const place = Number(raw);
    if (!Number.isInteger(place) || place < 1) {
      return;
    }
    if (current?.place === place) {
      return;
    }
    setPlace.mutate({ registrationId, place });
  };

  const placeBusy = setPlace.isPending || eliminatePlayer.isPending;
  const canAddPlayer = !['FINISHED', 'ARCHIVED'].includes(tournament.status);

  const onAddPlayer = (event: FormEvent) => {
    event.preventDefault();
    setAddMessage(null);
    setAddError(false);
    const query = playerQuery.trim();
    if (query.length < 2) {
      setAddError(true);
      setAddMessage('Введите Telegram ID, @username или никнейм игрока');
      return;
    }
    addPlayer.mutate(query, {
      onSuccess: (list) => {
        setPlayerQuery('');
        setAddError(false);
        const normalized = query.replace(/^@+/, '').toLowerCase();
        const added = list.find((item) => {
          const telegramId = item.user.telegramId;
          const username = item.user.username?.toLowerCase();
          const nickname = item.user.nickname?.toLowerCase();
          return (
            telegramId === query ||
            username === normalized ||
            nickname === normalized ||
            (item.user.username != null && `@${item.user.username}` === query)
          );
        });
        const name = added ? displayPlayerName(added.user) : query;
        const waiting = added?.status === 'WAITING';
        setAddMessage(waiting ? `${name} добавлен в лист ожидания` : `${name} добавлен в турнир`);
      },
      onError: (error) => {
        setAddError(true);
        if (isAxiosError(error)) {
          const message = error.response?.data?.message;
          if (typeof message === 'string' && message.trim()) {
            setAddMessage(message);
            return;
          }
          if (Array.isArray(message) && typeof message[0] === 'string') {
            setAddMessage(message[0]);
            return;
          }
        }
        setAddMessage('Не удалось добавить игрока. Проверьте данные и статус турнира.');
      },
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <button
          onClick={() => navigate('/tournaments')}
          className="self-start text-sm text-muted-foreground hover:text-foreground"
        >
          ‹ К списку турниров
        </button>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-medium">{tournament.title}</h1>
              <Badge>{tournamentStatusLabel(tournament.status)}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatDateTime(tournament.date)} · мест {tournament.maxPlayers} · пришли{' '}
              {arrivedCount} из {registrations?.length ?? 0}
              {isLive ? ` · в игре ${stillInCount} · места ${placedCount}` : ''}
            </p>
            {tournament.description && (
              <p className="mt-2 max-w-2xl whitespace-pre-wrap text-sm text-muted-foreground">
                {tournament.description}
              </p>
            )}
          </div>

          <TournamentActions
            tournamentId={tournament.id}
            status={tournament.status}
            onEdit={() => setEditOpen(true)}
            onFinish={() => setFinishOpen(true)}
            onDeleted={() => navigate('/tournaments')}
          />
        </div>
      </div>

      <Card className="gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-medium">Игроки и места</h2>
            {isLive && (
              <p className="mt-1 text-sm text-muted-foreground">
                Когда игрок вылетел — нажмите «Выбыл»: место проставится с конца автоматически.
                Можно править вручную до завершения турнира.
              </p>
            )}
          </div>
          {isLive && (
            <Button className="px-3 py-1.5 text-xs" onClick={() => setFinishOpen(true)}>
              Завершить с местами
            </Button>
          )}
        </div>

        {canAddPlayer && (
          <form
            onSubmit={onAddPlayer}
            className="flex flex-col gap-3 rounded-lg border border-border bg-secondary/40 p-3 sm:flex-row sm:items-end"
          >
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
              <span className="text-muted-foreground">
                Добавить по Telegram ID, @username или никнейму
              </span>
              <input
                value={playerQuery}
                onChange={(event) => setPlayerQuery(event.target.value)}
                placeholder="123456789 или @username или ник"
                autoComplete="off"
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </label>
            <Button type="submit" className="sm:w-auto" isLoading={addPlayer.isPending}>
              Добавить в турнир
            </Button>
            {addMessage && (
              <p
                className={`w-full text-sm sm:basis-full ${
                  addError ? 'text-destructive' : 'text-muted-foreground'
                }`}
              >
                {addMessage}
              </p>
            )}
          </form>
        )}

        {isRegistrationsLoading ? (
          <Loader />
        ) : !registrations || registrations.length === 0 ? (
          <p className="text-sm text-muted-foreground">На турнир пока никто не зарегистрирован</p>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Место</th>
                    <th className="py-2 pr-3 font-medium">Игрок</th>
                    <th className="py-2 pr-3 font-medium">Уровень</th>
                    <th className="py-2 pr-3 font-medium">Явка</th>
                    <th className="py-2 font-medium">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRegistrations.map((registration) => (
                    <tr key={registration.id} className="border-b border-border/60">
                      <td className="py-2.5 pr-3">
                        {isLive ? (
                          <PlaceInput
                            value={placeDrafts[registration.id] ?? ''}
                            disabled={placeBusy}
                            onChange={(value) =>
                              setPlaceDrafts((prev) => ({
                                ...prev,
                                [registration.id]: value,
                              }))
                            }
                            onSave={() => savePlace(registration.id)}
                          />
                        ) : (
                          <span className="font-medium">
                            {registration.place != null ? registration.place : '—'}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3">
                        <button
                          type="button"
                          className="flex items-center gap-2 rounded-md text-left hover:text-primary"
                          onClick={() => setActionRegistrationId(registration.id)}
                        >
                          <Avatar
                            src={registration.user.photoUrl ?? undefined}
                            fallback={displayPlayerName(registration.user)}
                            size={32}
                          />
                          <span className="underline-offset-2 hover:underline">
                            {displayPlayerName(registration.user)}
                          </span>
                        </button>
                      </td>
                      <td className="py-2.5 pr-3">
                        {registration.user.level} · {registration.user.xp.toLocaleString('ru-RU')}{' '}
                        XP
                      </td>
                      <td className="py-2.5 pr-3">
                        <AttendanceBadge registration={registration} />
                      </td>
                      <td className="py-2.5">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            className="px-3 py-1.5 text-xs"
                            onClick={() => setActionRegistrationId(registration.id)}
                          >
                            Профиль
                          </Button>
                          <Button
                            variant="secondary"
                            className="px-3 py-1.5 text-xs"
                            onClick={() => setQrPlayer(registration.user)}
                          >
                            QR
                          </Button>
                          {isLive && registration.place == null && (
                            <Button
                              className="px-3 py-1.5 text-xs"
                              disabled={placeBusy}
                              onClick={() => eliminatePlayer.mutate(registration.id)}
                            >
                              Выбыл
                            </Button>
                          )}
                          {isLive && registration.place != null && (
                            <Button
                              variant="ghost"
                              className="px-3 py-1.5 text-xs"
                              disabled={placeBusy}
                              onClick={() =>
                                setPlace.mutate({
                                  registrationId: registration.id,
                                  place: null,
                                })
                              }
                            >
                              Сбросить
                            </Button>
                          )}
                          <AttendanceActions
                            registration={registration}
                            isPending={markAttendance.isPending}
                            onMark={(arrived) =>
                              markAttendance.mutate({
                                registrationId: registration.id,
                                arrived,
                              })
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 md:hidden">
              {sortedRegistrations.map((registration) => (
                <div
                  key={registration.id}
                  className="flex flex-col gap-3 rounded-md border border-border p-3"
                >
                  <button
                    type="button"
                    className="flex items-center gap-3 rounded-md text-left"
                    onClick={() => setActionRegistrationId(registration.id)}
                  >
                    <Avatar
                      src={registration.user.photoUrl ?? undefined}
                      fallback={displayPlayerName(registration.user)}
                      size={40}
                    />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="font-medium text-primary underline-offset-2 hover:underline">
                        {displayPlayerName(registration.user)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Ур. {registration.user.level} ·{' '}
                        {registration.user.xp.toLocaleString('ru-RU')} XP · нажмите для действий
                      </span>
                    </div>
                    {registration.place != null && (
                      <Badge
                        style={{ background: 'rgba(184,134,59,0.2)', color: 'var(--primary)' }}
                      >
                        {registration.place} место
                      </Badge>
                    )}
                  </button>

                  <AttendanceBadge registration={registration} />

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      className="px-3 py-1.5 text-xs"
                      onClick={() => setActionRegistrationId(registration.id)}
                    >
                      Профиль · вылет / ребай
                    </Button>
                    <Button
                      variant="secondary"
                      className="px-3 py-1.5 text-xs"
                      onClick={() => setQrPlayer(registration.user)}
                    >
                      QR · печать
                    </Button>
                    {isLive && (
                      <>
                        <PlaceInput
                          value={placeDrafts[registration.id] ?? ''}
                          disabled={placeBusy}
                          onChange={(value) =>
                            setPlaceDrafts((prev) => ({
                              ...prev,
                              [registration.id]: value,
                            }))
                          }
                          onSave={() => savePlace(registration.id)}
                        />
                        {registration.place == null ? (
                          <Button
                            className="px-3 py-1.5 text-xs"
                            disabled={placeBusy}
                            onClick={() => eliminatePlayer.mutate(registration.id)}
                          >
                            Выбыл
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            className="px-3 py-1.5 text-xs"
                            disabled={placeBusy}
                            onClick={() =>
                              setPlace.mutate({
                                registrationId: registration.id,
                                place: null,
                              })
                            }
                          >
                            Сбросить
                          </Button>
                        )}
                      </>
                    )}
                  </div>

                  <AttendanceActions
                    registration={registration}
                    isPending={markAttendance.isPending}
                    onMark={(arrived) =>
                      markAttendance.mutate({ registrationId: registration.id, arrived })
                    }
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {(markAttendance.isError || setPlace.isError || eliminatePlayer.isError) && (
          <p className="text-sm text-destructive">
            Не удалось обновить игрока. Проверьте место (оно не должно повторяться) и статус
            турнира.
          </p>
        )}
      </Card>

      <Card className="gap-3">
        <h2 className="font-medium">История турнира</h2>
        {!history || history.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Событий пока нет</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {history.items.map((event) => (
              <li key={event.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex min-w-0 flex-col">
                  <span className="text-sm">
                    {PLAYER_EVENT_LABELS[event.type]}
                    {event.user
                      ? ` · ${`${event.user.firstName ?? ''} ${event.user.lastName ?? ''}`.trim()}`
                      : ''}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(event.createdAt)}
                    {event.performedBy ? ` · ${event.performedBy.name}` : ''}
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
        )}
      </Card>

      <TournamentFormModal
        open={isEditOpen}
        tournament={tournament as AdminTournament}
        onClose={() => setEditOpen(false)}
      />

      <FinishTournamentModal
        open={isFinishOpen}
        tournamentId={id}
        registrations={registrations ?? []}
        onClose={() => setFinishOpen(false)}
      />

      <PlayerQrModal
        open={qrPlayer !== null}
        qrCode={qrPlayer?.qrCode ?? null}
        playerName={qrPlayer ? displayPlayerName(qrPlayer) : ''}
        username={qrPlayer?.username}
        onClose={() => setQrPlayer(null)}
      />

      <TournamentPlayerActionsModal
        open={actionRegistration !== null}
        tournamentId={id}
        registration={actionRegistration}
        onClose={() => setActionRegistrationId(null)}
      />
    </div>
  );
}

function PlaceInput({
  value,
  disabled,
  onChange,
  onSave,
}: {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onSave: () => void;
}): JSX.Element {
  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        min={1}
        placeholder="—"
        disabled={disabled}
        className="w-16 rounded-md border border-border bg-secondary px-2 py-1.5 text-sm"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onSave}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.currentTarget.blur();
          }
        }}
      />
    </div>
  );
}

function AttendanceBadge({
  registration,
}: {
  registration: AdminTournamentRegistration;
}): JSX.Element {
  if (registration.place != null) {
    return (
      <Badge style={{ background: 'rgba(184,134,59,0.2)', color: 'var(--primary)' }}>
        {registration.place} место
        {registration.eliminatedAt ? ` · ${formatDateTime(registration.eliminatedAt)}` : ''}
      </Badge>
    );
  }

  if (registration.arrivedAt) {
    return (
      <Badge style={{ background: 'rgba(184,134,59,0.2)', color: 'var(--primary)' }}>
        Пришёл · {formatDateTime(registration.arrivedAt)}
      </Badge>
    );
  }

  if (registration.status === 'NO_SHOW') {
    return (
      <Badge style={{ background: 'rgba(192,57,43,0.2)', color: 'var(--destructive)' }}>
        Не пришёл
      </Badge>
    );
  }

  return <Badge style={{ background: 'var(--secondary)' }}>Ожидается</Badge>;
}

function AttendanceActions({
  registration,
  isPending,
  onMark,
}: {
  registration: AdminTournamentRegistration;
  isPending: boolean;
  onMark: (arrived: boolean) => void;
}): JSX.Element {
  return (
    <div className="flex gap-2">
      <Button
        variant="secondary"
        className="px-3 py-1.5 text-xs"
        disabled={isPending || !!registration.arrivedAt}
        onClick={() => onMark(true)}
      >
        Пришёл
      </Button>
      <Button
        variant="ghost"
        className="px-3 py-1.5 text-xs"
        disabled={isPending || registration.status === 'NO_SHOW'}
        onClick={() => onMark(false)}
      >
        Не пришёл
      </Button>
    </div>
  );
}
