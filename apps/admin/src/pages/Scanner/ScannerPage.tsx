import { useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ReEntryKindType, ScannedPlayerDto, ScannerEventType } from '@gutshot/types';
import { RE_ENTRY_KINDS } from '@gutshot/types';
import { Avatar, Badge, Button, Card } from '@gutshot/ui';
import { useApplyScannerEvent, useScanPlayer } from '../../entities/scanner';
import { QrScanner } from '../../widgets/QrScanner/QrScanner';
import { displayPlayerName } from '../../shared/lib/display-name';
import { PLAYER_EVENT_LABELS, SCANNER_EVENTS, formatDateTime } from '../../shared/lib/event-labels';
import { showToast } from '../../shared/ui/toast';

interface EventFeedback {
  playerName: string;
  label: string;
  xpAwarded: number;
  levelUp: boolean;
  level: number;
  achievementUnlocked: string | null;
  unlockedTitles: string[];
}

function buildActionMessage(feedback: EventFeedback): string {
  const lines = [`Действие выполнено: ${feedback.label}`, `Игрок: ${feedback.playerName}`];

  if (feedback.xpAwarded > 0) {
    lines.push(`+${feedback.xpAwarded} XP`);
  } else {
    lines.push('XP не начислен (уже было или отключено)');
  }

  if (feedback.levelUp) {
    lines.push(`Новый уровень: ${feedback.level}`);
  }

  if (feedback.unlockedTitles.length > 0) {
    lines.push(`Достижение: ${feedback.unlockedTitles.join(', ')}`);
  } else if (feedback.achievementUnlocked) {
    lines.push('Достижение разблокировано');
  }

  return lines.join('\n');
}

export function ScannerPage(): JSX.Element {
  const [qrCode, setQrCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [player, setPlayer] = useState<ScannedPlayerDto | null>(null);
  const [feedback, setFeedback] = useState<EventFeedback | null>(null);

  const scanPlayer = useScanPlayer();
  const applyEvent = useApplyScannerEvent();

  const lookup = useCallback(
    (code: string) => {
      scanPlayer.mutate(code, { onSuccess: (data) => setPlayer(data) });
    },
    [scanPlayer],
  );

  const handleScan = useCallback(
    (scanned: string) => {
      setScanning(false);
      setQrCode(scanned);
      setFeedback(null);
      lookup(scanned);
    },
    [lookup],
  );

  const handleEvent = (event: ScannerEventType, label: string, reEntryKind?: ReEntryKindType) => {
    if (!player) {
      return;
    }

    const playerName = displayPlayerName(player);

    applyEvent.mutate(
      {
        qrCode,
        event,
        tournamentId: player.registration?.tournamentId,
        reEntryKind,
      },
      {
        onSuccess: (result) => {
          const nextFeedback: EventFeedback = {
            playerName,
            label,
            xpAwarded: result.xpAwarded,
            levelUp: result.levelUp,
            level: result.level,
            achievementUnlocked: result.achievementUnlocked,
            unlockedTitles: (result.unlockedAchievements ?? []).map((item) => item.title),
          };
          setFeedback(nextFeedback);
          showToast(buildActionMessage(nextFeedback), 'success');
          lookup(qrCode);
        },
        onError: () => {
          showToast(
            `Не удалось выполнить «${label}» для ${playerName}.\nПроверьте регистрацию игрока на турнир.`,
            'error',
          );
        },
      },
    );
  };

  const registration = player?.registration;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-medium">QR Scanner</h1>
        <p className="text-sm text-muted-foreground">
          Отсканируйте постоянный QR-код игрока, чтобы отметить событие турнира
        </p>
      </div>

      <Card className="gap-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={qrCode}
            onChange={(event) => setQrCode(event.target.value)}
            placeholder="Код игрока, например GS-XXXXXXXXXXXXXXXX"
            className="flex-1 rounded-md border border-border bg-secondary px-3 py-2.5 text-foreground outline-none focus:ring-2 focus:ring-primary"
          />
          <Button
            onClick={() => lookup(qrCode)}
            isLoading={scanPlayer.isPending}
            disabled={!qrCode}
          >
            Найти
          </Button>
          <Button variant="ghost" onClick={() => setScanning((value) => !value)}>
            {scanning ? 'Остановить камеру' : '📷 Сканировать'}
          </Button>
        </div>

        {scanning && (
          <QrScanner active={scanning} onScan={handleScan} elementId="gutshot-scanner-page" />
        )}

        {!player && !scanning && !scanPlayer.isPending && (
          <div className="rounded-md border border-dashed border-border bg-secondary/40 px-4 py-6 text-sm text-muted-foreground">
            Введите код игрока или нажмите «Сканировать», чтобы открыть камеру. Это рабочий экран
            дилера, а не ошибка загрузки.
          </div>
        )}

        {scanPlayer.isError && (
          <p className="text-sm text-destructive">Игрок с таким QR-кодом не найден</p>
        )}
      </Card>

      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm"
          >
            <span className="font-medium text-primary">{feedback.label}</span> для{' '}
            <span className="font-medium">{feedback.playerName}</span> записано.{' '}
            {feedback.xpAwarded > 0
              ? `Начислено ${feedback.xpAwarded} XP.`
              : 'XP не начислен (уже засчитано ранее или отключено в настройках).'}
            {feedback.levelUp && ` Новый уровень: ${feedback.level}.`}
            {feedback.unlockedTitles.length > 0
              ? ` Достижение: ${feedback.unlockedTitles.join(', ')}.`
              : feedback.achievementUnlocked
                ? ' Достижение разблокировано.'
                : ''}
          </motion.div>
        )}
      </AnimatePresence>

      {player && (
        <>
          <Card className="gap-4">
            <div className="flex items-start gap-4">
              <Avatar
                src={player.photoUrl ?? undefined}
                fallback={displayPlayerName(player)}
                size={64}
              />

              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-medium">{displayPlayerName(player)}</h2>
                  {player.isBlocked && (
                    <Badge style={{ background: 'var(--destructive)', color: '#fff' }}>
                      Заблокирован
                    </Badge>
                  )}
                </div>
                {player.username && (
                  <p className="text-sm text-muted-foreground">@{player.username}</p>
                )}
                <p className="text-sm text-muted-foreground">Telegram ID: {player.telegramId}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Уровень" value={String(player.level)} />
              <Stat label="XP" value={player.xp.toLocaleString('ru-RU')} />
              <Stat label="Ре-энтри" value={String(registration?.reEntries ?? 0)} />
              <Stat label="Баунти" value={String(registration?.bounties ?? 0)} />
            </div>

            <div className="rounded-md border border-border px-4 py-3">
              {registration ? (
                <div className="flex flex-col gap-1 text-sm">
                  <span className="font-medium">{registration.tournamentTitle}</span>
                  <span className="text-muted-foreground">
                    Статус: {registration.status} · Регистрация:{' '}
                    {formatDateTime(registration.registeredAt)}
                  </span>
                  <span className="text-muted-foreground">
                    Явка:{' '}
                    {registration.arrivedAt
                      ? `${formatDateTime(registration.arrivedAt)}${
                          registration.attendanceXpGiven ? ' (XP начислен)' : ''
                        }`
                      : 'не отмечена'}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Нет активной регистрации. Доступны только события комбинаций.
                </p>
              )}
            </div>
          </Card>

          <Card className="gap-3">
            <h3 className="font-medium">Отметить событие</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {SCANNER_EVENTS.filter((event) => event.value !== 'RE_ENTRY').map((event) => {
                const needsRegistration = ['ARRIVED', 'ELIMINATED', 'RE_ENTRY', 'BOUNTY'].includes(
                  event.value,
                );

                return (
                  <Button
                    key={event.value}
                    variant="secondary"
                    disabled={
                      applyEvent.isPending ||
                      player.isBlocked ||
                      (needsRegistration && !registration)
                    }
                    onClick={() => handleEvent(event.value, event.label)}
                    className="flex-col gap-1 py-4"
                  >
                    <span className="text-lg">{event.icon}</span>
                    <span className="text-xs">{event.label}</span>
                  </Button>
                );
              })}
            </div>

            <div className="mt-2">
              <p className="mb-2 text-xs text-muted-foreground">
                Ре-энтри возвращает в игру (сбрасывает вылет), аддон просто добавляет фишек.
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { kind: 'RE_ENTRY_1000' as const, event: 'RE_ENTRY' as const },
                  { kind: 'RE_ENTRY_1500' as const, event: 'RE_ENTRY' as const },
                  { kind: 'ADDON_1000' as const, event: 'ADDON' as const },
                ].map(({ kind, event }) => {
                  const meta = RE_ENTRY_KINDS[kind];
                  return (
                    <Button
                      key={kind}
                      variant="primary"
                      disabled={applyEvent.isPending || player.isBlocked || !registration}
                      onClick={() => handleEvent(event, meta.label, kind)}
                      className="flex-col gap-1 py-4"
                    >
                      <span className="text-lg">{kind === 'ADDON_1000' ? '➕' : '🔁'}</span>
                      <span className="text-xs">{meta.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {applyEvent.isError && (
              <p className="text-sm text-destructive">
                Не удалось записать событие. Проверьте регистрацию игрока на турнир.
              </p>
            )}
          </Card>

          <Card className="gap-3">
            <h3 className="font-medium">Последние события</h3>
            {player.recentEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">История пока пуста</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {player.recentEvents.map((event) => (
                  <li key={event.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="flex min-w-0 flex-col">
                      <span className="text-sm">{PLAYER_EVENT_LABELS[event.type]}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(event.createdAt)}
                        {event.tournament ? ` · ${event.tournament.title}` : ''}
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
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="rounded-md border border-border px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-medium">{value}</p>
    </div>
  );
}
