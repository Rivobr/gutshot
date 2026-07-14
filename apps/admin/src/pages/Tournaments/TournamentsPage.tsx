import { useState } from 'react';
import { Badge, Button, Card, Loader } from '@gutshot/ui';
import { useAdminTournaments, useTournamentAction } from '../../entities/tournament';
import { CreateTournamentModal } from './CreateTournamentModal';

export function TournamentsPage(): JSX.Element {
  const { data: tournaments, isLoading } = useAdminTournaments();
  const [isCreateOpen, setCreateOpen] = useState(false);
  const openAction = useTournamentAction('open');
  const closeAction = useTournamentAction('close');
  const startAction = useTournamentAction('start');

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium">Турниры</h1>
        <Button onClick={() => setCreateOpen(true)}>+ Создать турнир</Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {tournaments?.map((tournament) => (
          <Card key={tournament.id} className="gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{tournament.title}</h3>
              <Badge>{tournament.status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {new Date(tournament.date).toLocaleString('ru-RU')} · Бай-ин {tournament.buyIn} ₽ · Мест{' '}
              {tournament.maxPlayers}
            </p>
            <div className="flex gap-2">
              {tournament.status === 'DRAFT' && (
                <Button
                  className="px-3 py-1.5 text-xs"
                  isLoading={openAction.isPending}
                  onClick={() => openAction.mutate(tournament.id)}
                >
                  Открыть регистрацию
                </Button>
              )}
              {tournament.status === 'REGISTRATION_OPEN' && (
                <Button
                  variant="secondary"
                  className="px-3 py-1.5 text-xs"
                  isLoading={closeAction.isPending}
                  onClick={() => closeAction.mutate(tournament.id)}
                >
                  Закрыть регистрацию
                </Button>
              )}
              {tournament.status === 'REGISTRATION_CLOSED' && (
                <Button
                  className="px-3 py-1.5 text-xs"
                  isLoading={startAction.isPending}
                  onClick={() => startAction.mutate(tournament.id)}
                >
                  Начать турнир
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      <CreateTournamentModal open={isCreateOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
