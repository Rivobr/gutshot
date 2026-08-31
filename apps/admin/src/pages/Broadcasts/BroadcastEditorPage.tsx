import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import type { BroadcastDeliveryDto, BroadcastSegment } from '@gutshot/types';
import { Button, Card, Loader } from '@gutshot/ui';
import {
  broadcastPhotoUrl,
  useBroadcast,
  useBroadcastPreview,
  useCreateBroadcast,
  useDeleteBroadcastDraft,
  useDeleteBroadcastMessage,
  useDeleteBroadcastMessages,
  useSendBroadcast,
  useUpdateBroadcast,
  useUploadBroadcastPhoto,
} from '../../entities/broadcast';
import { formatDateTime } from '../../shared/lib/event-labels';

const SEGMENT_OPTIONS: { value: BroadcastSegment; label: string }[] = [
  { value: 'ALL_ACTIVE', label: 'Всем игрокам' },
  { value: 'SINGLE_PLAYER', label: 'Одному человеку (по Telegram ID)' },
];

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Черновик',
  SENDING: 'Отправляется',
  SENT: 'Отправлена',
  FAILED: 'Ошибка',
};

const DELIVERY_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Ожидает',
  SENT: 'Доставлено',
  FAILED: 'Ошибка',
  SKIPPED: 'Пропущено',
  DELETED: 'Удалено',
};

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
  const isNew = !id || id === 'new';

  const { data: existing, isLoading } = useBroadcast(isNew ? '' : id);
  const createBroadcast = useCreateBroadcast();
  const updateBroadcast = useUpdateBroadcast(id ?? '');
  const sendBroadcast = useSendBroadcast(id ?? '');
  const uploadPhoto = useUploadBroadcastPhoto();
  const deleteMessages = useDeleteBroadcastMessages(id ?? '');
  const deleteMessage = useDeleteBroadcastMessage(id ?? '');
  const removeDraft = useDeleteBroadcastDraft();

  const [title, setTitle] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [segment, setSegment] = useState<BroadcastSegment>('ALL_ACTIVE');
  const [targetTelegramId, setTargetTelegramId] = useState('');
  const [photoPath, setPhotoPath] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isNew || !existing) return;
    setTitle(existing.title);
    setBodyHtml(existing.bodyHtml);
    if (existing.segment === 'ALL_ACTIVE' || existing.segment === 'SINGLE_PLAYER') {
      setSegment(existing.segment);
    }
    setTargetTelegramId(existing.targetTelegramId ?? '');
    setPhotoPath(existing.photoPath ?? '');
  }, [existing, isNew]);

  const legacySegment =
    existing && existing.segment !== 'ALL_ACTIVE' && existing.segment !== 'SINGLE_PLAYER';

  const preview = useBroadcastPreview(
    segment,
    segment === 'SINGLE_PLAYER' ? targetTelegramId.trim() || undefined : undefined,
  );

  const canEdit = isNew || existing?.status === 'DRAFT' || existing?.status === 'FAILED';

  const photoPreviewSrc = photoPath
    ? broadcastPhotoUrl(photoPath)
    : existing?.photoUrl && !photoPath
      ? existing.photoUrl
      : null;

  const onPickPhoto = async (file: File | undefined) => {
    if (!file) return;
    setMessage(null);
    setIsError(false);
    try {
      const res = await uploadPhoto.mutateAsync(file);
      setPhotoPath(res.photoPath);
    } catch (error) {
      setIsError(true);
      setMessage(errorMessage(error));
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const onSave = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setIsError(false);
    const payload = {
      title: title.trim(),
      bodyHtml: bodyHtml.trim(),
      segment,
      targetTelegramId: segment === 'SINGLE_PLAYER' ? targetTelegramId.trim() : null,
      photoPath: photoPath || null,
    };
    try {
      if (isNew) {
        const created = await createBroadcast.mutateAsync(payload);
        navigate(`/broadcasts/${created.id}`, { replace: true });
      } else {
        await updateBroadcast.mutateAsync(payload);
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
            ? 'Текст, фото и получатель — потом «Отправить»'
            : `Статус: ${STATUS_LABEL[existing?.status ?? ''] ?? existing?.status} · получателей ${existing?.recipientCount}`}
        </p>
      </div>

      {legacySegment && (
        <Card className="gap-2 border-amber-500/50">
          <p className="text-sm">
            Это рассылка старого формата (сегмент «{existing?.segment}»). Отправить её заново нельзя
            — создайте новую.
          </p>
        </Card>
      )}

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
            <span className="text-sm text-muted-foreground">Текст сообщения</span>
            <textarea
              value={bodyHtml}
              disabled={!canEdit}
              onChange={(e) => setBodyHtml(e.target.value)}
              rows={8}
              placeholder="Поддерживается HTML Telegram: &lt;b&gt;жирный&lt;/b&gt;, &lt;i&gt;курсив&lt;/i&gt;"
              className="rounded-md border border-border bg-secondary px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-muted-foreground">Фото (необязательно)</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={!canEdit || uploadPhoto.isPending}
              onChange={(e) => void onPickPhoto(e.target.files?.[0])}
              className="rounded-md border border-border bg-secondary px-3 py-2.5 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:text-primary-foreground"
            />
            <span className="text-xs text-muted-foreground">
              JPEG / PNG / WebP, до 10 МБ. Текст уйдёт подписью к фото.
            </span>
            {photoPreviewSrc && (
              <div className="mt-1 flex flex-col items-start gap-2">
                <img
                  src={photoPreviewSrc}
                  alt="Превью фото"
                  className="max-h-48 rounded-md border border-border object-contain"
                />
                {canEdit && (
                  <Button type="button" variant="secondary" onClick={() => setPhotoPath('')}>
                    Убрать фото
                  </Button>
                )}
              </div>
            )}
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

          {segment === 'SINGLE_PLAYER' && (
            <label className="flex flex-col gap-1.5 sm:max-w-sm">
              <span className="text-sm text-muted-foreground">Telegram ID получателя</span>
              <input
                value={targetTelegramId}
                disabled={!canEdit}
                onChange={(e) => setTargetTelegramId(e.target.value)}
                placeholder="например 123456789"
                inputMode="numeric"
                className="rounded-md border border-border bg-secondary px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </label>
          )}

          <div className="rounded-md border border-border bg-secondary/50 p-3 text-sm">
            <p className="font-medium">
              Получателей: {preview.isFetching ? '…' : (preview.data?.count ?? '—')}
            </p>
            {segment === 'SINGLE_PLAYER' && preview.data?.sample?.length ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Найден игрок: {preview.data.sample.map((s) => s.name).join(', ')}
              </p>
            ) : null}
          </div>

          {canEdit && (
            <Button
              type="submit"
              isLoading={createBroadcast.isPending || updateBroadcast.isPending}
            >
              {isNew ? 'Сохранить рассылку' : 'Сохранить изменения'}
            </Button>
          )}
        </Card>
      </form>

      {!isNew && existing && !legacySegment && (
        <Card className="gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-medium">Отправка</h2>
            <div className="flex flex-wrap gap-2">
              {(existing.status === 'DRAFT' || existing.status === 'FAILED') && (
                <Button
                  isLoading={sendBroadcast.isPending}
                  onClick={async () => {
                    if (
                      !window.confirm(
                        `Отправить рассылку «${existing.title}» ${existing.recipientCount} получателю(ям)?`,
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
                  Отправить
                </Button>
              )}
              {existing.deliveries.some(
                (d) => d.status === 'SENT' && d.telegramMessageId != null,
              ) && (
                <Button
                  variant="secondary"
                  isLoading={deleteMessages.isPending}
                  onClick={async () => {
                    if (
                      !window.confirm(
                        'Удалить ВСЕ отправленные сообщения этой рассылки в Telegram?',
                      )
                    ) {
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
                  Удалить все сообщения
                </Button>
              )}
              {existing.status === 'DRAFT' && (
                <Button
                  variant="secondary"
                  isLoading={removeDraft.isPending}
                  onClick={async () => {
                    if (!window.confirm('Удалить черновик?')) return;
                    try {
                      await removeDraft.mutateAsync(existing.id);
                      navigate('/broadcasts');
                    } catch (error) {
                      setIsError(true);
                      setMessage(errorMessage(error));
                    }
                  }}
                >
                  Удалить черновик
                </Button>
              )}
            </div>
          </div>

          {existing.deliveries.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ещё не отправляли</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {existing.deliveries.map((d) => (
                <DeliveryRow key={d.id} delivery={d} onDelete={deleteMessage} />
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

function DeliveryRow({
  delivery,
  onDelete,
}: {
  delivery: BroadcastDeliveryDto;
  onDelete: ReturnType<typeof useDeleteBroadcastMessage>;
}): JSX.Element {
  const canDelete =
    delivery.status === 'SENT' && delivery.telegramMessageId != null && !onDelete.isPending;

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
      <span>
        {delivery.name} · {delivery.telegramId}
      </span>
      <span className="flex items-center gap-2 text-muted-foreground">
        {DELIVERY_STATUS_LABEL[delivery.status] ?? delivery.status}
        {delivery.telegramMessageId != null ? (
          <>
            {' '}
            · message_id{' '}
            <code className="rounded bg-secondary px-1">{delivery.telegramMessageId}</code>
          </>
        ) : null}
        {delivery.sentAt ? ` · ${formatDateTime(delivery.sentAt)}` : ''}
        {delivery.error ? ` · ${delivery.error}` : ''}
        {canDelete && (
          <button
            type="button"
            className="rounded-md border border-border px-2 py-1 text-xs text-red-400 hover:bg-secondary"
            disabled={onDelete.isPending}
            onClick={() => {
              if (
                window.confirm(
                  `Удалить сообщение ${delivery.telegramMessageId} у ${delivery.name}?`,
                )
              ) {
                onDelete.mutate(delivery.id);
              }
            }}
          >
            Удалить
          </button>
        )}
      </span>
    </li>
  );
}

export function BroadcastNewPage(): JSX.Element {
  return <BroadcastEditorPage />;
}

export function BroadcastDetailsPage(): JSX.Element {
  const { id = '' } = useParams();
  return <BroadcastEditorPage id={id === 'new' ? undefined : id} />;
}
