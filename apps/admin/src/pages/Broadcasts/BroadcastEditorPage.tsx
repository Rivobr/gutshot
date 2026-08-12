import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import type {
  BroadcastButtons,
  BroadcastCustomButton,
  BroadcastSegment,
} from '@gutshot/types';
import { Button, Card, Loader } from '@gutshot/ui';
import {
  useBroadcast,
  useBroadcastPreview,
  useCreateBroadcast,
  useDeleteBroadcastMessages,
  useSendBroadcast,
  useTestBroadcast,
  useUpdateBroadcast,
} from '../../entities/broadcast';
import { useAdminTournaments } from '../../entities/tournament';
import { usePlayers } from '../../entities/player';
import { formatDateTime } from '../../shared/lib/event-labels';

const SEGMENT_OPTIONS: { value: BroadcastSegment; label: string }[] = [
  { value: 'ALL_ACTIVE', label: 'Все активные игроки' },
  { value: 'TOURNAMENT_REGISTERED', label: 'Записанные на турнир' },
  { value: 'TOURNAMENT_RSVP_PENDING', label: 'Записанные, ещё не подтвердили RSVP' },
  { value: 'SINGLE_PLAYER', label: 'Один игрок' },
];

const BUTTON_OPTIONS: { value: BroadcastButtons; label: string }[] = [
  { value: 'NONE', label: 'Без кнопок' },
  { value: 'OPEN_APP', label: 'Открыть клуб' },
  { value: 'RSVP', label: 'Буду / Не смогу' },
  { value: 'CUSTOM', label: 'Свои кнопки' },
];

function errorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const payload = error.response?.data as { message?: string | string[] } | undefined;
    if (typeof payload?.message === 'string') return payload.message;
    if (Array.isArray(payload?.message)) return payload.message.join(', ');
  }
  return 'Ошибка запроса';
}

function playerLabel(p: {
  nickname?: string | null;
  firstName?: string | null;
  username?: string | null;
  telegramId: string;
}): string {
  return p.nickname || p.firstName || (p.username ? `@${p.username}` : p.telegramId);
}

export function BroadcastEditorPage({ id }: { id?: string }): JSX.Element {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isNew = !id || id === 'new';

  const { data: existing, isLoading } = useBroadcast(isNew ? '' : id);
  const { data: tournaments } = useAdminTournaments();
  const { data: players } = usePlayers();
  const createBroadcast = useCreateBroadcast();
  const updateBroadcast = useUpdateBroadcast(id ?? '');
  const testBroadcast = useTestBroadcast(id ?? '');
  const sendBroadcast = useSendBroadcast(id ?? '');
  const deleteMessages = useDeleteBroadcastMessages(id ?? '');

  const [title, setTitle] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [segment, setSegment] = useState<BroadcastSegment>('ALL_ACTIVE');
  const [tournamentId, setTournamentId] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  const [playerQuery, setPlayerQuery] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [buttons, setButtons] = useState<BroadcastButtons>('NONE');
  const [customButtons, setCustomButtons] = useState<BroadcastCustomButton[]>([
    { text: '', type: 'url', url: '' },
  ]);
  const [testTelegramId, setTestTelegramId] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (isNew) {
      const seg = searchParams.get('segment') as BroadcastSegment | null;
      const tid = searchParams.get('tournamentId');
      const btn = searchParams.get('buttons') as BroadcastButtons | null;
      const preTitle = searchParams.get('title');
      const uid = searchParams.get('targetUserId');
      if (seg) setSegment(seg);
      if (tid) setTournamentId(tid);
      if (btn) setButtons(btn);
      if (preTitle) setTitle(preTitle);
      if (uid) setTargetUserId(uid);
      return;
    }
    if (!existing) return;
    setTitle(existing.title);
    setBodyHtml(existing.bodyHtml);
    setSegment(existing.segment);
    setTournamentId(existing.tournamentId ?? '');
    setTargetUserId(existing.targetUserId ?? '');
    setPhotoUrl(existing.photoUrl ?? '');
    setButtons(existing.buttons);
    setCustomButtons(
      existing.customButtons?.length
        ? existing.customButtons
        : [{ text: '', type: 'url', url: '' }],
    );
  }, [existing, isNew, searchParams]);

  const needsTournament =
    segment === 'TOURNAMENT_REGISTERED' ||
    segment === 'TOURNAMENT_RSVP_PENDING' ||
    buttons === 'RSVP';
  const needsPlayer = segment === 'SINGLE_PLAYER';

  const preview = useBroadcastPreview(
    segment,
    tournamentId || undefined,
    targetUserId || undefined,
  );

  const filteredPlayers = useMemo(() => {
    const q = playerQuery.trim().toLowerCase();
    const list = players ?? [];
    const matched = !q
      ? list.slice(0, 40)
      : list
          .filter((p) => {
            const hay =
              `${p.nickname ?? ''} ${p.firstName ?? ''} ${p.username ?? ''} ${p.telegramId}`.toLowerCase();
            return hay.includes(q);
          })
          .slice(0, 40);
    const selected = list.find((p) => p.id === targetUserId);
    if (selected && !matched.some((p) => p.id === selected.id)) {
      return [selected, ...matched];
    }
    return matched;
  }, [players, playerQuery, targetUserId]);

  const isDraft = isNew || existing?.status === 'DRAFT' || existing?.status === 'FAILED';
  const canEdit = isNew || existing?.status === 'DRAFT' || existing?.status === 'FAILED';

  const payload = useMemo(
    () => ({
      title: title.trim(),
      bodyHtml: bodyHtml.trim(),
      segment,
      tournamentId: needsTournament ? tournamentId || undefined : undefined,
      targetUserId: needsPlayer ? targetUserId || undefined : undefined,
      photoUrl: photoUrl.trim() || undefined,
      buttons,
      customButtons:
        buttons === 'CUSTOM'
          ? customButtons
              .filter((b) => b.text.trim())
              .map((b) => ({
                text: b.text.trim(),
                type: b.type ?? 'url',
                url: b.type === 'open_app' ? undefined : b.url?.trim() || undefined,
              }))
          : undefined,
    }),
    [
      title,
      bodyHtml,
      segment,
      tournamentId,
      targetUserId,
      photoUrl,
      needsTournament,
      needsPlayer,
      buttons,
      customButtons,
    ],
  );

  const onSave = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setIsError(false);
    try {
      if (isNew) {
        const created = await createBroadcast.mutateAsync(payload);
        setMessage('Черновик сохранён');
        navigate(`/broadcasts/${created.id}`, { replace: true });
      } else {
        await updateBroadcast.mutateAsync({
          ...payload,
          tournamentId: needsTournament ? tournamentId || null : null,
          targetUserId: needsPlayer ? targetUserId || null : null,
          photoUrl: photoUrl.trim() || null,
          customButtons: buttons === 'CUSTOM' ? payload.customButtons ?? [] : null,
        });
        setMessage('Сохранено');
      }
    } catch (error) {
      setIsError(true);
      setMessage(errorMessage(error));
    }
  };

  if (!isNew && isLoading) {
    return <Loader />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/broadcasts" className="text-sm text-muted-foreground hover:underline">
          ← Рассылки
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-medium">{isNew ? 'Новая рассылка' : existing?.title}</h1>
        <p className="text-sm text-muted-foreground">
          {isNew
            ? 'Сначала сохраните черновик, затем тест и отправка'
            : `Статус: ${existing?.status} · получателей ${existing?.recipientCount}`}
        </p>
      </div>

      <form onSubmit={onSave} className="flex flex-col gap-4">
        <Card className="gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-muted-foreground">Название</span>
            <input
              value={title}
              disabled={!canEdit}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-md border border-border bg-secondary px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-muted-foreground">Кому</span>
            <select
              value={segment}
              disabled={!canEdit}
              onChange={(e) => setSegment(e.target.value as BroadcastSegment)}
              className="rounded-md border border-border bg-secondary px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary"
            >
              {SEGMENT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          {needsTournament && (
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-muted-foreground">Турнир</span>
              <select
                value={tournamentId}
                disabled={!canEdit}
                onChange={(e) => setTournamentId(e.target.value)}
                className="rounded-md border border-border bg-secondary px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Выберите турнир</option>
                {(tournaments ?? []).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} · {new Date(t.date).toLocaleString('ru-RU')}
                  </option>
                ))}
              </select>
            </label>
          )}

          {needsPlayer && (
            <div className="flex flex-col gap-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm text-muted-foreground">Поиск игрока</span>
                <input
                  value={playerQuery}
                  disabled={!canEdit}
                  onChange={(e) => setPlayerQuery(e.target.value)}
                  placeholder="ник / @username / telegram id"
                  className="rounded-md border border-border bg-secondary px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm text-muted-foreground">Игрок</span>
                <select
                  value={targetUserId}
                  disabled={!canEdit}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="rounded-md border border-border bg-secondary px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">Выберите игрока</option>
                  {filteredPlayers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {playerLabel(p)} · {p.telegramId}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-muted-foreground">
              Фото (URL картинки, необязательно)
            </span>
            <input
              value={photoUrl}
              disabled={!canEdit}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://..."
              className="rounded-md border border-border bg-secondary px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary"
            />
            <span className="text-xs text-muted-foreground">
              Telegram скачает фото по ссылке. Текст уйдёт подписью к фото.
            </span>
            {photoUrl.trim() && (
              <img
                src={photoUrl.trim()}
                alt="Превью"
                className="mt-1 max-h-40 rounded-md border border-border object-contain"
              />
            )}
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-muted-foreground">Кнопки</span>
            <select
              value={buttons}
              disabled={!canEdit}
              onChange={(e) => setButtons(e.target.value as BroadcastButtons)}
              className="rounded-md border border-border bg-secondary px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary"
            >
              {BUTTON_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          {buttons === 'CUSTOM' && (
            <div className="flex flex-col gap-3 rounded-md border border-border p-3">
              <p className="text-sm font-medium">Свои кнопки</p>
              {customButtons.map((btn, index) => (
                <div key={index} className="grid gap-2 sm:grid-cols-3">
                  <input
                    value={btn.text}
                    disabled={!canEdit}
                    placeholder="Текст"
                    onChange={(e) => {
                      const next = [...customButtons];
                      next[index] = { ...next[index], text: e.target.value };
                      setCustomButtons(next);
                    }}
                    className="rounded-md border border-border bg-secondary px-3 py-2 text-sm"
                  />
                  <select
                    value={btn.type ?? 'url'}
                    disabled={!canEdit}
                    onChange={(e) => {
                      const next = [...customButtons];
                      next[index] = {
                        ...next[index],
                        type: e.target.value as 'url' | 'open_app',
                      };
                      setCustomButtons(next);
                    }}
                    className="rounded-md border border-border bg-secondary px-3 py-2 text-sm"
                  >
                    <option value="url">Ссылка</option>
                    <option value="open_app">Открыть клуб</option>
                  </select>
                  <div className="flex gap-2">
                    <input
                      value={btn.url ?? ''}
                      disabled={!canEdit || btn.type === 'open_app'}
                      placeholder="https://..."
                      onChange={(e) => {
                        const next = [...customButtons];
                        next[index] = { ...next[index], url: e.target.value };
                        setCustomButtons(next);
                      }}
                      className="min-w-0 flex-1 rounded-md border border-border bg-secondary px-3 py-2 text-sm"
                    />
                    {canEdit && customButtons.length > 1 && (
                      <button
                        type="button"
                        className="rounded-md border border-border px-2 text-sm"
                        onClick={() =>
                          setCustomButtons(customButtons.filter((_, i) => i !== index))
                        }
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {canEdit && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    setCustomButtons([...customButtons, { text: '', type: 'url', url: '' }])
                  }
                >
                  + Кнопка
                </Button>
              )}
            </div>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-muted-foreground">
              Текст (HTML Telegram: &lt;b&gt;, &lt;i&gt;)
            </span>
            <textarea
              value={bodyHtml}
              disabled={!canEdit}
              onChange={(e) => setBodyHtml(e.target.value)}
              rows={10}
              className="rounded-md border border-border bg-secondary px-3 py-2.5 font-mono text-sm outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </label>

          <div className="rounded-md border border-border bg-secondary/50 p-3 text-sm">
            <p className="font-medium">Получателей сейчас: {preview.data?.count ?? '…'}</p>
            {preview.data?.sample?.length ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Например: {preview.data.sample.map((s) => s.name).join(', ')}
              </p>
            ) : null}
          </div>

          {canEdit && (
            <Button type="submit" isLoading={createBroadcast.isPending || updateBroadcast.isPending}>
              {isNew ? 'Сохранить черновик' : 'Сохранить изменения'}
            </Button>
          )}
        </Card>
      </form>

      {!isNew && (
        <Card className="gap-4">
          <h2 className="text-lg font-medium">Тест и отправка</h2>
          <label className="flex flex-col gap-1.5 sm:max-w-sm">
            <span className="text-sm text-muted-foreground">Telegram ID для теста</span>
            <input
              value={testTelegramId}
              onChange={(e) => setTestTelegramId(e.target.value)}
              placeholder="например 123456789"
              className="rounded-md border border-border bg-secondary px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              isLoading={testBroadcast.isPending}
              onClick={async () => {
                setMessage(null);
                setIsError(false);
                try {
                  const res = await testBroadcast.mutateAsync(testTelegramId.trim());
                  setMessage(`Тест отправлен, message_id=${res.messageId}`);
                } catch (error) {
                  setIsError(true);
                  setMessage(errorMessage(error));
                }
              }}
            >
              Отправить тест
            </Button>
            {isDraft && (
              <Button
                isLoading={sendBroadcast.isPending}
                onClick={async () => {
                  if (
                    !window.confirm(
                      `Отправить рассылку ${preview.data?.count ?? existing?.recipientCount ?? ''} получателям?`,
                    )
                  ) {
                    return;
                  }
                  setMessage(null);
                  setIsError(false);
                  try {
                    const res = await sendBroadcast.mutateAsync();
                    setMessage(`Готово: доставлено ${res.sentCount}, ошибок ${res.failedCount}`);
                  } catch (error) {
                    setIsError(true);
                    setMessage(errorMessage(error));
                  }
                }}
              >
                Утвердить и отправить
              </Button>
            )}
            {existing?.status === 'SENT' && (
              <Button
                variant="secondary"
                isLoading={deleteMessages.isPending}
                onClick={async () => {
                  if (!window.confirm('Удалить все отправленные сообщения этой рассылки в Telegram?')) {
                    return;
                  }
                  setMessage(null);
                  setIsError(false);
                  try {
                    const res = await deleteMessages.mutateAsync();
                    setMessage(`Удалено сообщений: ${res.deleted}, ошибок: ${res.failed}`);
                  } catch (error) {
                    setIsError(true);
                    setMessage(errorMessage(error));
                  }
                }}
              >
                Удалить сообщения в Telegram
              </Button>
            )}
          </div>
        </Card>
      )}

      {!isNew && existing && 'deliveries' in existing && existing.deliveries && (
        <Card className="gap-4">
          <h2 className="text-lg font-medium">Отчёт / message_id</h2>
          {existing.deliveries.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ещё не отправляли</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {existing.deliveries.map((d) => (
                <li key={d.id} className="flex flex-wrap justify-between gap-2 py-2 text-sm">
                  <span>
                    {d.name} · {d.telegramId}
                  </span>
                  <span className="text-muted-foreground">
                    {d.status}
                    {d.telegramMessageId != null ? ` · msg ${d.telegramMessageId}` : ''}
                    {d.sentAt ? ` · ${formatDateTime(d.sentAt)}` : ''}
                    {d.error ? ` · ${d.error}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {message && (
        <p className={`text-sm ${isError ? 'text-red-400' : 'text-primary'}`}>{message}</p>
      )}
    </div>
  );
}

export function BroadcastNewPage(): JSX.Element {
  return <BroadcastEditorPage />;
}

export function BroadcastDetailsPage(): JSX.Element {
  const { id = '' } = useParams();
  return <BroadcastEditorPage id={id === 'new' ? undefined : id} />;
}
