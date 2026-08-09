import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { AdminStatistics } from '@gutshot/types';
import { Card, Loader } from '@gutshot/ui';
import { apiClient } from '../../shared/api/client';
import { formatDateTime } from '../../shared/lib/event-labels';

async function fetchStatistics(): Promise<AdminStatistics> {
  const { data } = await apiClient.get('/admin/statistics');
  return data.data;
}

export function StatisticsPage(): JSX.Element {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'statistics'],
    queryFn: fetchStatistics,
  });

  if (isLoading) {
    return <Loader />;
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-start gap-4">
        <h1 className="text-xl font-medium sm:text-2xl">Статистика</h1>
        <p className="rounded-lg border border-border bg-card px-4 py-6 text-sm text-destructive">
          Не удалось загрузить статистику.
        </p>
        <button
          type="button"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          onClick={() => void refetch()}
          disabled={isFetching}
        >
          {isFetching ? 'Загрузка…' : 'Повторить'}
        </button>
      </div>
    );
  }

  const rebuys = data.recentRebuys ?? [];
  const totalRebuys = data.totalRebuys ?? rebuys.length;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-medium sm:text-2xl">Статистика</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
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
        <Card>
          <p className="text-sm text-muted-foreground">Ребаев</p>
          <p className="text-2xl font-medium text-primary">{totalRebuys}</p>
        </Card>
      </div>

      <Card className="gap-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-medium">Ребаи (ре-энтри)</h2>
            <p className="text-sm text-muted-foreground">
              Кто и когда делал ребай. Отмечается сканером на турнире.
            </p>
          </div>
          <span className="text-sm text-muted-foreground">
            Показано {rebuys.length}
            {totalRebuys > rebuys.length ? ` из ${totalRebuys}` : ''}
          </span>
        </div>

        {rebuys.length === 0 ? (
          <p className="rounded-md border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
            Пока нет отмеченных ребаев. Они появятся здесь после кнопки «Ре-энтри» в QR Scanner.
          </p>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Когда</th>
                    <th className="py-2 pr-3 font-medium">Игрок</th>
                    <th className="py-2 pr-3 font-medium">Telegram</th>
                    <th className="py-2 font-medium">Турнир</th>
                  </tr>
                </thead>
                <tbody>
                  {rebuys.map((item) => (
                    <tr key={item.id} className="border-b border-border/60">
                      <td className="py-2.5 pr-3 whitespace-nowrap">
                        {formatDateTime(item.createdAt)}
                      </td>
                      <td className="py-2.5 pr-3 font-medium">{item.playerName}</td>
                      <td className="py-2.5 pr-3 text-muted-foreground">
                        {item.username ? `@${item.username}` : `ID ${item.telegramId}`}
                      </td>
                      <td className="py-2.5">
                        {item.tournamentId ? (
                          <Link
                            to={`/tournaments/${item.tournamentId}`}
                            className="text-primary hover:underline"
                          >
                            {item.tournamentTitle ?? 'Турнир'}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 md:hidden">
              {rebuys.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-1 rounded-md border border-border p-3 text-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium">{item.playerName}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDateTime(item.createdAt)}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {item.username ? `@${item.username}` : `ID ${item.telegramId}`}
                  </span>
                  {item.tournamentId ? (
                    <Link
                      to={`/tournaments/${item.tournamentId}`}
                      className="text-primary hover:underline"
                    >
                      {item.tournamentTitle ?? 'Турнир'}
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

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
