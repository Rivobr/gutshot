import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { isAxiosError } from 'axios';
import type {
  AdminTournamentRegistration,
  ReEntryKindType,
  ScannerEventType,
} from '@gutshot/types';
import { RE_ENTRY_KINDS } from '@gutshot/types';
import { Avatar, Badge, Button, Card } from '@gutshot/ui';
import { useApplyScannerEvent } from '../../entities/scanner';
import { displayPlayerName } from '../../shared/lib/display-name';
import { formatDateTime, SCANNER_EVENTS } from '../../shared/lib/event-labels';
import { showToast } from '../../shared/ui/toast';

const TOURNAMENT_ACTIONS: ScannerEventType[] = [
  'ARRIVED',
  'ELIMINATED',
  'BOUNTY',
  'FOUR_OF_A_KIND',
  'STRAIGHT_FLUSH',
  'ROYAL_FLUSH',
];

const RE_ENTRY_ACTIONS: { kind: ReEntryKindType; event: ScannerEventType }[] = [
  { kind: 'RE_ENTRY_1000', event: 'RE_ENTRY' },
  { kind: 'RE_ENTRY_1500', event: 'RE_ENTRY' },
  { kind: 'ADDON_1000', event: 'ADDON' },
];

export interface TournamentPlayerActionsModalProps {
  open: boolean;
  tournamentId: string;
  registration: AdminTournamentRegistration | null;
  onClose: () => void;
}

function buildActionMessage(
  label: string,
  playerName: string,
  xpAwarded: number,
  levelUp: boolean,
  level: number,
  unlockedTitles: string[],
): string {
  const lines = [`Действие выполнено: ${label}`, `Игрок: ${playerName}`];
  if (xpAwarded > 0) {
    lines.push(`+${xpAwarded} XP`);
  } else {
    lines.push('XP не начислен (уже было или отключено)');
  }
  if (levelUp) {
    lines.push(`Новый уровень: ${level}`);
  }
  if (unlockedTitles.length > 0) {
    lines.push(`Достижение: ${unlockedTitles.join(', ')}`);
  }
  return lines.join('\n');
}

/** Профиль игрока на турнире: быстрые действия как в QR Scanner. */
export function TournamentPlayerActionsModal({
  open,
  tournamentId,
  registration,
  onClose,
}: TournamentPlayerActionsModalProps): JSX.Element | null {
  const applyEvent = useApplyScannerEvent();
  const [lastLabel, setLastLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setLastLabel(null);
    }
  }, [open, registration?.id]);

  const events = useMemo(
    () => SCANNER_EVENTS.filter((event) => TOURNAMENT_ACTIONS.includes(event.value)),
    [],
  );

  if (!open || !registration) {
    return null;
  }

  const user = registration.user;
  const playerName = displayPlayerName(user);
  const qrCode = user.qrCode?.trim() ?? '';
  const canAct = Boolean(qrCode);

  const handleEvent = (event: ScannerEventType, label: string, reEntryKind?: ReEntryKindType) => {
    if (!qrCode) {
      showToast('У игрока нет QR-кода — действие недоступно', 'error');
      return;
    }

    setLastLabel(label);
    applyEvent.mutate(
      { qrCode, event, tournamentId, reEntryKind },
      {
        onSuccess: (result) => {
          showToast(
            buildActionMessage(
              label,
              playerName,
              result.xpAwarded,
              result.levelUp,
              result.level,
              (result.unlockedAchievements ?? []).map((item) => item.title),
            ),
            'success',
          );
        },
        onError: (error) => {
          const apiMessage = isAxiosError(error)
            ? (error.response?.data as { message?: string } | undefined)?.message
            : undefined;
          showToast(
            apiMessage?.trim() ||
              `Не удалось выполнить «${label}» для ${playerName}.\nПроверьте регистрацию игрока на турнир.`,
            'error',
          );
        },
      },
    );
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={`Профиль игрока ${playerName}`}
      onClick={onClose}
    >
      <Card
        className="max-h-[92vh] w-full max-w-lg gap-4 overflow-y-auto p-4 sm:p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <Avatar src={user.photoUrl ?? undefined} fallback={playerName} size={56} />
            <div className="flex min-w-0 flex-col gap-1">
              <h2 className="text-lg font-medium">{playerName}</h2>
              {user.username && <p className="text-sm text-muted-foreground">@{user.username}</p>}
              <p className="text-xs text-muted-foreground">Telegram ID: {user.telegramId}</p>
            </div>
          </div>
          <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={onClose}>
            Закрыть
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Уровень" value={String(user.level)} />
          <Stat label="XP" value={user.xp.toLocaleString('ru-RU')} />
          <Stat label="Ре-энтри" value={String(registration.reEntries)} />
          <Stat label="Баунти" value={String(registration.bounties)} />
        </div>

        <div className="rounded-md border border-border px-3 py-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            {registration.place != null ? (
              <Badge style={{ background: 'rgba(184,134,59,0.2)', color: 'var(--primary)' }}>
                {registration.place} место
              </Badge>
            ) : (
              <Badge style={{ background: 'var(--secondary)' }}>В игре / без места</Badge>
            )}
            {registration.arrivedAt ? (
              <Badge style={{ background: 'rgba(184,134,59,0.2)', color: 'var(--primary)' }}>
                Пришёл
              </Badge>
            ) : (
              <Badge style={{ background: 'var(--secondary)' }}>Явка не отмечена</Badge>
            )}
          </div>
          <p className="mt-2 text-muted-foreground">
            Явка:{' '}
            {registration.arrivedAt ? formatDateTime(registration.arrivedAt) : 'ещё не отмечена'}
            {registration.eliminatedAt
              ? ` · вылет ${formatDateTime(registration.eliminatedAt)}`
              : ''}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="font-medium">Быстрые действия</h3>
          <p className="text-xs text-muted-foreground">
            Как в QR Scanner: вылет ставит место с конца, ре-энтри возвращает в игру.
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {events.map((event) => (
              <Button
                key={event.value}
                variant={event.value === 'ELIMINATED' ? 'primary' : 'secondary'}
                disabled={applyEvent.isPending || !canAct}
                onClick={() => handleEvent(event.value, event.label)}
                className="flex-col gap-1 py-4"
              >
                <span className="text-lg">{event.icon}</span>
                <span className="text-xs">{event.label}</span>
              </Button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Ре-энтри возвращает в игру (сбрасывает вылет), аддон просто добавляет фишек.
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {RE_ENTRY_ACTIONS.map(({ kind, event }) => {
              const meta = RE_ENTRY_KINDS[kind];
              return (
                <Button
                  key={kind}
                  variant="primary"
                  disabled={applyEvent.isPending || !canAct}
                  onClick={() => handleEvent(event, meta.label, kind)}
                  className="flex-col gap-1 py-4"
                >
                  <span className="text-lg">{kind === 'ADDON_1000' ? '➕' : '🔁'}</span>
                  <span className="text-xs">{meta.label}</span>
                </Button>
              );
            })}
          </div>
          {!canAct && (
            <p className="text-sm text-destructive">
              У игрока нет QR-кода — сначала откройте его через «Игроки» или бота.
            </p>
          )}
          {applyEvent.isPending && lastLabel && (
            <p className="text-sm text-muted-foreground">Записываем «{lastLabel}»…</p>
          )}
        </div>
      </Card>
    </div>,
    document.body,
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
