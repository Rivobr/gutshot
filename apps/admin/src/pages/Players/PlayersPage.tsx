import type { CSSProperties } from 'react';
import { Avatar, Badge, Button, Loader } from '@gutshot/ui';
import { usePlayers, useTogglePlayerBlock, useTogglePlayerVerify } from '../../entities/player';

function verifyBadgeStyle(verified: boolean): CSSProperties {
  return verified
    ? { background: 'rgba(46,160,67,0.16)', color: '#3fb950' }
    : { background: 'rgba(120,110,90,0.16)', color: '#a0967f' };
}

function statusBadgeStyle(blocked: boolean): CSSProperties {
  return blocked
    ? { background: 'rgba(192,57,43,0.16)', color: '#e5534b' }
    : { background: 'rgba(46,160,67,0.16)', color: '#3fb950' };
}

export function PlayersPage(): JSX.Element {
  const { data: players, isLoading } = usePlayers();
  const toggleBlock = useTogglePlayerBlock();
  const toggleVerify = useTogglePlayerVerify();

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-medium sm:text-2xl">Игроки</h1>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-secondary text-secondary-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Игрок</th>
              <th className="px-4 py-3 text-left">Telegram</th>
              <th className="px-4 py-3 text-left">XP</th>
              <th className="px-4 py-3 text-left">Уровень</th>
              <th className="px-4 py-3 text-left">Посещений</th>
              <th className="px-4 py-3 text-left">Побед</th>
              <th className="px-4 py-3 text-left">KYC</th>
              <th className="px-4 py-3 text-left">Статус</th>
              <th className="px-4 py-3 text-left"></th>
            </tr>
          </thead>
          <tbody>
            {players?.map((player) => (
              <tr key={player.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar
                      src={player.photoUrl}
                      fallback={`${player.firstName ?? ''} ${player.lastName ?? ''}`}
                      size={32}
                    />
                    {player.firstName} {player.lastName}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">@{player.username ?? '—'}</td>
                <td className="px-4 py-3">{player.xp}</td>
                <td className="px-4 py-3">{player.level}</td>
                <td className="px-4 py-3">{player.visits}</td>
                <td className="px-4 py-3">{player.wins}</td>
                <td className="px-4 py-3">
                  <Badge style={verifyBadgeStyle(player.isVerified)}>
                    {player.isVerified ? '✓ Подтверждён' : 'Не подтверждён'}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge style={statusBadgeStyle(player.isBlocked)}>
                    {player.isBlocked ? 'Заблокирован' : 'Активен'}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button
                      variant={player.isVerified ? 'secondary' : 'primary'}
                      className="px-3 py-1.5 text-xs"
                      isLoading={toggleVerify.isPending}
                      onClick={() =>
                        toggleVerify.mutate({ id: player.id, verified: player.isVerified })
                      }
                    >
                      {player.isVerified ? 'Снять KYC' : 'Подтвердить KYC'}
                    </Button>
                    <Button
                      variant={player.isBlocked ? 'secondary' : 'destructive'}
                      className="px-3 py-1.5 text-xs"
                      isLoading={toggleBlock.isPending}
                      onClick={() => toggleBlock.mutate({ id: player.id, blocked: player.isBlocked })}
                    >
                      {player.isBlocked ? 'Разблокировать' : 'Заблокировать'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {players?.map((player) => (
          <div key={player.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <Avatar
                src={player.photoUrl}
                fallback={`${player.firstName ?? ''} ${player.lastName ?? ''}`}
                size={40}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {player.firstName} {player.lastName}
                </p>
                <p className="truncate text-xs text-muted-foreground">@{player.username ?? '—'}</p>
              </div>
              <Badge style={statusBadgeStyle(player.isBlocked)}>
                {player.isBlocked ? 'Заблок.' : 'Активен'}
              </Badge>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
              <div>
                <p className="text-muted-foreground">XP</p>
                <p className="font-medium">{player.xp}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Ур.</p>
                <p className="font-medium">{player.level}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Визитов</p>
                <p className="font-medium">{player.visits}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Побед</p>
                <p className="font-medium">{player.wins}</p>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <Badge style={verifyBadgeStyle(player.isVerified)}>
                {player.isVerified ? '✓ KYC' : 'Без KYC'}
              </Badge>
            </div>

            <div className="mt-3 flex flex-col gap-2">
              <Button
                variant={player.isVerified ? 'secondary' : 'primary'}
                className="w-full py-2 text-xs"
                isLoading={toggleVerify.isPending}
                onClick={() => toggleVerify.mutate({ id: player.id, verified: player.isVerified })}
              >
                {player.isVerified ? 'Снять подтверждение KYC' : 'Подтвердить KYC'}
              </Button>
              <Button
                variant={player.isBlocked ? 'secondary' : 'destructive'}
                className="w-full py-2 text-xs"
                isLoading={toggleBlock.isPending}
                onClick={() => toggleBlock.mutate({ id: player.id, blocked: player.isBlocked })}
              >
                {player.isBlocked ? 'Разблокировать' : 'Заблокировать'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
