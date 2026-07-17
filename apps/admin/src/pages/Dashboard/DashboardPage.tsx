import { Card, Loader } from '@gutshot/ui';
import { useDashboard } from '../../entities/dashboard';

export function DashboardPage(): JSX.Element {
  const { data, isLoading } = useDashboard();

  if (isLoading || !data) {
    return <Loader />;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-medium sm:text-2xl">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <p className="text-sm text-muted-foreground">Игроков</p>
          <p className="text-2xl font-medium">{data.playersCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Активных турниров</p>
          <p className="text-2xl font-medium">{data.activeTournaments}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Регистраций</p>
          <p className="text-2xl font-medium">{data.registrationsCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Свободных мест</p>
          <p className="text-2xl font-medium text-primary">{data.freeSlots}</p>
        </Card>
      </div>

      {data.nearestTournament && (
        <Card>
          <p className="text-sm text-muted-foreground">Ближайший турнир</p>
          <p className="text-lg font-medium">{data.nearestTournament.title}</p>
          <p className="text-sm text-muted-foreground">
            {new Date(data.nearestTournament.date).toLocaleString('ru-RU')}
          </p>
        </Card>
      )}

      <Card className="gap-3">
        <p className="text-sm text-muted-foreground">Последние регистрации</p>
        <div className="flex flex-col divide-y divide-border">
          {data.recentRegistrations?.map((registration) => (
            <div
              key={registration.id}
              className="flex flex-col gap-1 py-2 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3"
            >
              <span className="font-medium">
                {registration.user?.firstName} {registration.user?.lastName}
              </span>
              <span className="text-muted-foreground sm:flex-1 sm:text-center">
                {registration.tournament?.title}
              </span>
              <span className="text-primary">{registration.status}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
