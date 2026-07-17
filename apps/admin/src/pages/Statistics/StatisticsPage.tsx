import { useQuery } from '@tanstack/react-query';
import type { AdminStatistics } from '@gutshot/types';
import { Card, Loader } from '@gutshot/ui';
import { apiClient } from '../../shared/api/client';

async function fetchStatistics(): Promise<AdminStatistics> {
  const { data } = await apiClient.get('/admin/statistics');
  return data.data;
}

export function StatisticsPage(): JSX.Element {
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'statistics'], queryFn: fetchStatistics });

  if (isLoading || !data) {
    return <Loader />;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-medium sm:text-2xl">Статистика</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <p className="text-sm text-muted-foreground">Игроков</p>
          <p className="text-2xl font-medium">{data.playersCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Турниров</p>
          <p className="text-2xl font-medium">{data.tournamentsCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Посещений</p>
          <p className="text-2xl font-medium">{data.totalVisits}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Побед</p>
          <p className="text-2xl font-medium text-primary">{data.totalWins}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="gap-2">
          <p className="text-sm text-muted-foreground">Самые активные игроки</p>
          {data.topPlayers.map((player) => (
            <div key={player.userId} className="flex justify-between text-sm">
              <span>{player.name}</span>
              <span className="text-primary">{player.xp} XP</span>
            </div>
          ))}
        </Card>
        <Card className="gap-2">
          <p className="text-sm text-muted-foreground">Самые посещаемые турниры</p>
          {data.topTournaments.map((tournament) => (
            <div key={tournament.id} className="flex justify-between text-sm">
              <span>{tournament.title}</span>
              <span className="text-primary">{tournament.registrations} игроков</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
