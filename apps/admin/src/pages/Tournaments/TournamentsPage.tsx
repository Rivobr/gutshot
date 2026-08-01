import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card, Loader } from '@gutshot/ui';
import type { AdminTournament } from '../../entities/tournament';
import { useAdminTournaments } from '../../entities/tournament';
import { tournamentStatusLabel } from '../../shared/lib/tournament-status';
import { TournamentFormModal } from './TournamentFormModal';
import { TournamentActions } from './TournamentActions';

type FilterTab = 'active' | 'finished' | 'all';

const FILTERS: { id: FilterTab; label: string }[] = [
  { id: 'active', label: 'Активные' },
  { id: 'finished', label: 'Завершённые' },
  { id: 'all', label: 'Все' },
];

function isActiveStatus(status: string): boolean {
  return ['DRAFT', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'IN_PROGRESS'].includes(status);
}

export function TournamentsPage(): JSX.Element {
  const navigate = useNavigate();
  const { data: tournaments, isLoading } = useAdminTournaments();
  const [filter, setFilter] = useState<FilterTab>('active');
  const [isFormOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminTournament | null>(null);

  const filtered = useMemo(() => {
    const list = tournaments ?? [];
    if (filter === 'active') {
      return list.filter((item) => isActiveStatus(item.status));
    }
    if (filter === 'finished') {
      return list.filter((item) => item.status === 'FINISHED' || item.status === 'ARCHIVED');
    }
    return list;
  }, [tournaments, filter]);

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-medium sm:text-2xl">Турниры</h1>
          <p className="text-sm text-muted-foreground">
            Создание, статусы, завершение и удаление турниров
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          + Создать турнир
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className="rounded-full px-3 py-1.5 text-sm transition-colors"
            style={{
              background: filter === item.id ? 'var(--primary)' : 'var(--secondary)',
              color: filter === item.id ? 'var(--primary-foreground)' : 'var(--secondary-foreground)',
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {!filtered.length ? (
        <Card>
          <p className="text-sm text-muted-foreground">Турниров в этой категории пока нет</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((tournament) => (
            <Card key={tournament.id} className="gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-medium">{tournament.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {new Date(tournament.date).toLocaleString('ru-RU')} · мест{' '}
                    {tournament.maxPlayers}
                    {tournament._count?.registrations != null
                      ? ` · записано ${tournament._count.registrations}`
                      : ''}
                  </p>
                </div>
                <Badge>{tournamentStatusLabel(tournament.status)}</Badge>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="ghost"
                  className="px-3 py-1.5 text-xs"
                  onClick={() => navigate(`/tournaments/${tournament.id}`)}
                >
                  Открыть
                </Button>
                <TournamentActions
                  compact
                  tournamentId={tournament.id}
                  status={tournament.status}
                  onEdit={() => {
                    setEditing(tournament);
                    setFormOpen(true);
                  }}
                  onFinish={() => navigate(`/tournaments/${tournament.id}?finish=1`)}
                />
              </div>
            </Card>
          ))}
        </div>
      )}

      <TournamentFormModal
        open={isFormOpen}
        tournament={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
      />
    </div>
  );
}
