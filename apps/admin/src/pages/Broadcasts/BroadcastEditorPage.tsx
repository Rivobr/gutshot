import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import type { BroadcastButtons, BroadcastSegment } from '@gutshot/types';
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
import { formatDateTime } from '../../shared/lib/event-labels';

const SEGMENT_OPTIONS: { value: BroadcastSegment; label: string }[] = [
  { value: 'ALL_ACTIVE', label: 'Все активные игроки' },
  { value: 'TOURNAMENT_REGISTERED', label: 'Записанные на турнир' },
  { value: 'TOURNAMENT_RSVP_PENDING', label: 'Записанные, ещё не подтвердили RSVP' },
];

const BUTTON_OPTIONS: { value: BroadcastButtons; label: string }[] = [
  { value: 'NONE', label: 'Без кнопок' },
  { value: 'OPEN_APP', label: 'Открыть клуб' },
  { value: 'RSVP', label: 'Буду / Не смогу' },
];

function errorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const payload = error.response?.data as { message?: string | string[] } | undefined;
    if (typeof payload?.message === 'string') return payload.message;
    if (Array.isArray(payload?.message)) return payload.message.join(', ');
  }
  return 'Ошибка запроса';
}

export function BroadcastEditorPage({ id }: { id?: string }): JSX.Element {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isNew = !id || id === 'new';

  const { data: existing, isLoading } = useBroadcast(isNew ? '' : id);
  const { data: tournaments } = useAdminTournaments();
  const createBroadcast = useCreateBroadcast();
  const updateBroadcast = useUpdateBroadcast(id ?? '');
  const testBroadcast = useTestBroadcast(id ?? '');
  const sendBroadcast = useSendBroadcast(id ?? '');
  const deleteMessages = useDeleteBroadcastMessages(id ?? '');

  const [title, setTitle] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [segment, setSegment] = useState<BroadcastSegment>('ALL_ACTIVE');
  const [tournamentId, setTournamentId] = useState('');
  const [buttons, setButtons] = useState<BroadcastButtons>('NONE');
  const [testTelegramId, setTestTelegramId] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (isNew) {
      const seg = searchParams.get('segment') as BroadcastSegment | null;
      const tid = searchParams.get('tournamentId');
      const btn = searchParams.get('buttons') as BroadcastButtons | null;
      const preTitle = searchParams.get('title');
      if (seg) setSegment(seg);
      if (tid) setTournamentId(tid);
      if (btn) setButtons(btn);
      if (preTitle) setTitle(preTitle);
      return;
    }
    if (!existing) return;
    setTitle(existing.title);
    setBodyHtml(existing.bodyHtml);
    setSegment(existing.segment);
    setTournamentId(existing.tournamentId ?? '');
    setButtons(existing.buttons);
  }, [existing, isNew, searchParams]);

  const needsTournament =
    segment === 'TOURNAMENT_REGISTERED' ||
    segment === 'TOURNAMENT_RSVP_PENDING' ||
    buttons === 'RSVP';

  const preview = useBroadcastPreview(segment, tournamentId || undefined);

  const isDraft = isNew || existing?.status === 'DRAFT' || existing?.status === 'FAILED';
  const canEdit = isNew || existing?.status === 'DRAFT' || existing?.status === 'FAILED';

  const payload = useMemo(
    () => ({
      title: title.trim(),
      bodyHtml: bodyHtml.trim(),
      segment,
      tournamentId: needsTournament ? tournamentId || undefined : undefined,
      buttons,
    }),
    [title, bodyHtml, segment, tournamentId, needsTournament, buttons],
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

          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-muted-foreground">Текст (HTML Telegram: &lt;b&gt;, &lt;i&gt;)</span>
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

      {!isNew && existing && existing.deliveries && (
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
