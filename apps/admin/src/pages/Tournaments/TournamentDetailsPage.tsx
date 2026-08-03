import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { AdminTournamentRegistration } from '@gutshot/types';
import { Avatar, Badge, Button, Card, Loader } from '@gutshot/ui';
import {
  useAdminTournament,
  useMarkAttendance,
  useTournamentRegistrations,
  type AdminTournament,
} from '../../entities/tournament';
import { useAdminHistory } from '../../entities/history';
import { PLAYER_EVENT_LABELS, formatDateTime } from '../../shared/lib/event-labels';
import { tournamentStatusLabel } from '../../shared/lib/tournament-status';
import { TournamentActions } from './TournamentActions';
import { TournamentFormModal } from './TournamentFormModal';
import { FinishTournamentModal } from './FinishTournamentModal';
import { TournamentLivePanel } from './TournamentLivePanel';

function displayName(
  user: AdminTournamentRegistration['user'] & { nickname?: string | null },
): string {
  if (user.nickname?.trim()) {
    return user.nickname.trim();
  }
  const name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
  return name || user.username || 'Игрок';
}

export function TournamentDetailsPage(): JSX.Element {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: tournament, isLoading } = useAdminTournament(id);
  const { data: registrations, isLoading: isRegistrationsLoading } = useTournamentRegistrations(id);
  const { data: history } = useAdminHistory({ tournamentId: id, take: 50 });
  const markAttendance = useMarkAttendance(id);

  const [isEditOpen, setEditOpen] = useState(false);
  const [isFinishOpen, setFinishOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('finish') === '1') {
      setFinishOpen(true);
      searchParams.delete('finish');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  if (isLoading || !tournament) {
    return <Loader />;
  }

  const arrivedCount = (registrations ?? []).filter((item) => item.arrivedAt).length;

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
            </p>
            {tournament.description && (
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
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

      <TournamentLivePanel tournamentId={tournament.id} live={tournament.live} />

      <Card className="gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-medium">Зарегистрированные игроки</h2>
          {tournament.status === 'IN_PROGRESS' && (
            <Button className="px-3 py-1.5 text-xs" onClick={() => setFinishOpen(true)}>
              Завершить с местами
            </Button>
          )}
        </div>

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
                    <th className="py-2 pr-3 font-medium">Игрок</th>
                    <th className="py-2 pr-3 font-medium">Telegram ID</th>
                    <th className="py-2 pr-3 font-medium">Уровень</th>
                    <th className="py-2 pr-3 font-medium">XP</th>
                    <th className="py-2 pr-3 font-medium">Регистрация</th>
                    <th className="py-2 pr-3 font-medium">Явка</th>
                    <th className="py-2 font-medium">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((registration) => (
                    <tr key={registration.id} className="border-b border-border/60">
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-2">
                          <Avatar
                            src={registration.user.photoUrl ?? undefined}
                            fallback={displayName(registration.user)}
                            size={32}
                          />
                          <span>{displayName(registration.user)}</span>
                        </div>
                      </td>
                      <td className="py-2.5 pr-3 text-muted-foreground">
                        {registration.user.telegramId}
                      </td>
                      <td className="py-2.5 pr-3">{registration.user.level}</td>
                      <td className="py-2.5 pr-3">
                        {registration.user.xp.toLocaleString('ru-RU')}
                      </td>
                      <td className="py-2.5 pr-3 text-muted-foreground">
                        {formatDateTime(registration.registeredAt)}
                      </td>
                      <td className="py-2.5 pr-3">
                        <AttendanceBadge registration={registration} />
                      </td>
                      <td className="py-2.5">
                        <AttendanceActions
                          registration={registration}
                          isPending={markAttendance.isPending}
                          onMark={(arrived) =>
                            markAttendance.mutate({ registrationId: registration.id, arrived })
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 md:hidden">
              {registrations.map((registration) => (
                <div
                  key={registration.id}
                  className="flex flex-col gap-3 rounded-md border border-border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={registration.user.photoUrl ?? undefined}
                      fallback={displayName(registration.user)}
                      size={40}
                    />
                    <div className="flex min-w-0 flex-col">
                      <span className="font-medium">{displayName(registration.user)}</span>
                      <span className="text-xs text-muted-foreground">
                        ID {registration.user.telegramId} · Ур. {registration.user.level} ·{' '}
                        {registration.user.xp.toLocaleString('ru-RU')} XP
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <AttendanceBadge registration={registration} />
                    <AttendanceActions
                      registration={registration}
                      isPending={markAttendance.isPending}
                      onMark={(arrived) =>
                        markAttendance.mutate({ registrationId: registration.id, arrived })
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {markAttendance.isError && (
          <p className="text-sm text-destructive">Не удалось изменить отметку явки</p>
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
    </div>
  );
}

function AttendanceBadge({
  registration,
}: {
  registration: AdminTournamentRegistration;
}): JSX.Element {
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
