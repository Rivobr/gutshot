import { Avatar, Badge, Button, Loader } from '@gutshot/ui';
import { usePlayers, useTogglePlayerBlock } from '../../entities/player';

export function PlayersPage(): JSX.Element {
  const { data: players, isLoading } = usePlayers();
  const toggleBlock = useTogglePlayerBlock();

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-medium">Игроки</h1>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-secondary-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Игрок</th>
              <th className="px-4 py-3 text-left">Telegram</th>
              <th className="px-4 py-3 text-left">XP</th>
              <th className="px-4 py-3 text-left">Уровень</th>
              <th className="px-4 py-3 text-left">Посещений</th>
              <th className="px-4 py-3 text-left">Побед</th>
              <th className="px-4 py-3 text-left">Статус</th>
              <th className="px-4 py-3 text-left"></th>
            </tr>
          </thead>
          <tbody>
            {players?.map((player) => (
              <tr key={player.id} className="border-t border-border">
                <td className="flex items-center gap-2 px-4 py-3">
                  <Avatar
                    src={player.photoUrl}
                    fallback={`${player.firstName ?? ''} ${player.lastName ?? ''}`}
                    size={32}
                  />
                  {player.firstName} {player.lastName}
                </td>
                <td className="px-4 py-3 text-muted-foreground">@{player.username ?? '—'}</td>
                <td className="px-4 py-3">{player.xp}</td>
                <td className="px-4 py-3">{player.level}</td>
                <td className="px-4 py-3">{player.visits}</td>
                <td className="px-4 py-3">{player.wins}</td>
                <td className="px-4 py-3">
                  <Badge>{player.isBlocked ? 'Заблокирован' : 'Активен'}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Button
                    variant={player.isBlocked ? 'secondary' : 'destructive'}
                    className="px-3 py-1.5 text-xs"
                    isLoading={toggleBlock.isPending}
                    onClick={() => toggleBlock.mutate({ id: player.id, blocked: player.isBlocked })}
                  >
                    {player.isBlocked ? 'Разблокировать' : 'Заблокировать'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
