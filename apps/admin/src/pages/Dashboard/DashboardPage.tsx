import { Link } from 'react-router-dom';
import { Card, Loader } from '@gutshot/ui';
import { useDashboard } from '../../entities/dashboard';

const QUICK_ACTIONS = [
  { to: '/scanner', label: 'Сканировать QR', icon: '🔍' },
  { to: '/tournaments', label: 'Турниры', icon: '🏆' },
  { to: '/players', label: 'Игроки', icon: '👥' },
  { to: '/statistics', label: 'Статистика', icon: '📈' },
];

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    REGISTERED: 'Записан',
    CHECKED_IN: 'Пришёл',
    PLAYING: 'Играет',
    FINISHED: 'Завершил',
    WAITING: 'Лист ожидания',
    CANCELLED: 'Отменена',
  };
  return labels[status] ?? status;
}

export function DashboardPage(): JSX.Element {
  const { data, isLoading, isError, refetch, isFetching } = useDashboard();

  if (isLoading) {
    return <Loader />;
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-start gap-4">
        <h1 className="text-xl font-medium sm:text-2xl">Обзор клуба</h1>
        <p className="rounded-lg border border-border bg-card px-4 py-6 text-sm text-destructive">
          Не удалось загрузить дашборд. Проверьте интернет и обновите страницу.
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

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-medium sm:text-2xl">Обзор клуба</h1>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-3 text-sm font-medium transition-colors hover:border-primary"
          >
            <span className="text-lg leading-none">{action.icon}</span>
            {action.label}
          </Link>
        ))}
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
        {data.recentRegistrations?.length ? (
          <div className="flex flex-col divide-y divide-border">
            {data.recentRegistrations.map((registration) => (
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
                <span className="text-primary">{statusLabel(registration.status)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">Регистраций пока нет</p>
        )}
      </Card>
    </div>
  );
}
