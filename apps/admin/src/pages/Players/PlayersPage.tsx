import { useMemo, useState, type CSSProperties, type FormEvent } from 'react';
import type { AdminPlayerListItem } from '@gutshot/types';
import { Avatar, Badge, Button, Loader } from '@gutshot/ui';
import {
  useCreatePlayer,
  usePlayers,
  useTogglePlayerBlock,
  useTogglePlayerVerify,
} from '../../entities/player';
import { displayPlayerName } from '../../shared/lib/display-name';
import { PlayerQrModal } from '../../widgets/PlayerQrModal/PlayerQrModal';

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
  const { data: players, isLoading, isError, refetch, isFetching } = usePlayers();
  const toggleBlock = useTogglePlayerBlock();
  const toggleVerify = useTogglePlayerVerify();
  const createPlayer = useCreatePlayer();
  const [search, setSearch] = useState('');
  const [qrPlayer, setQrPlayer] = useState<AdminPlayerListItem | null>(null);
  const [telegramId, setTelegramId] = useState('');
  const [createMessage, setCreateMessage] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return players ?? [];
    return (players ?? []).filter((player) => {
      const fields = [
        displayPlayerName(player),
        player.nickname,
        player.firstName,
        player.lastName,
        player.username,
        player.username ? `@${player.username}` : null,
        player.qrCode,
        player.telegramId,
      ];
      return fields.filter(Boolean).some((field) => String(field).toLowerCase().includes(query));
    });
  }, [players, search]);

  const onCreate = (event: FormEvent) => {
    event.preventDefault();
    setCreateMessage(null);
    const id = telegramId.trim();
    if (!/^\d{5,20}$/.test(id)) {
      setCreateMessage('Введите числовой Telegram ID (5–20 цифр)');
      return;
    }
    createPlayer.mutate(
      { telegramId: id },
      {
        onSuccess: (player) => {
          setTelegramId('');
          setCreateMessage(
            `Игрок добавлен: ${displayPlayerName(player)} · ${player.qrCode ?? 'QR позже'}`,
          );
          setQrPlayer(player);
        },
        onError: () => {
          setCreateMessage('Не удалось добавить игрока. Проверьте ID и соединение.');
        },
      },
    );
  };

  if (isLoading) {
    return <Loader />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-start gap-4">
        <h1 className="text-xl font-medium sm:text-2xl">Игроки</h1>
        <p className="rounded-lg border border-border bg-card px-4 py-6 text-sm text-destructive">
          Не удалось загрузить список игроков. Это не «пустой клуб» — запрос к серверу не прошёл.
        </p>
        <Button onClick={() => void refetch()} isLoading={isFetching}>
          Повторить
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-medium sm:text-2xl">
          Игроки
          <span className="ml-2 text-sm text-muted-foreground">{filtered.length}</span>
        </h1>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Поиск: ник, имя, @username, QR, Telegram ID"
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary sm:max-w-xs"
        />
      </div>

      <form
        onSubmit={onCreate}
        className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-end"
      >
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Добавить по Telegram ID</span>
          <input
            value={telegramId}
            onChange={(event) => setTelegramId(event.target.value.replace(/\D/g, ''))}
            inputMode="numeric"
            placeholder="Например 123456789"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>
        <Button type="submit" className="sm:w-auto" isLoading={createPlayer.isPending}>
          Добавить игрока
        </Button>
        {createMessage && (
          <p className="w-full text-sm text-muted-foreground sm:basis-full">{createMessage}</p>
        )}
      </form>

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
            {filtered.map((player) => (
              <tr key={player.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar src={player.photoUrl} fallback={displayPlayerName(player)} size={32} />
                    {displayPlayerName(player)}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {player.username ? `@${player.username}` : `ID ${player.telegramId}`}
                </td>
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
                      variant="secondary"
                      className="px-3 py-1.5 text-xs"
                      onClick={() => setQrPlayer(player)}
                    >
                      QR
                    </Button>
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
                      onClick={() =>
                        toggleBlock.mutate({ id: player.id, blocked: player.isBlocked })
                      }
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
        {filtered.map((player) => (
          <div key={player.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <Avatar src={player.photoUrl} fallback={displayPlayerName(player)} size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{displayPlayerName(player)}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {player.username ? `@${player.username}` : `ID ${player.telegramId}`}
                </p>
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
                variant="secondary"
                className="w-full py-2 text-xs"
                onClick={() => setQrPlayer(player)}
              >
                QR-код · печать
              </Button>
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

      {filtered.length === 0 && (
        <p className="rounded-lg border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          Игроки не найдены по текущему поиску
        </p>
      )}

      <PlayerQrModal
        open={qrPlayer !== null}
        qrCode={qrPlayer?.qrCode ?? null}
        playerName={qrPlayer ? displayPlayerName(qrPlayer) : ''}
        username={qrPlayer?.username}
        onClose={() => setQrPlayer(null)}
      />
    </div>
  );
}
