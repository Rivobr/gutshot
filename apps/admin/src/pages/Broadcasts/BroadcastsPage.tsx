import { Link } from 'react-router-dom';
import type { BroadcastStatus } from '@gutshot/types';
import { Button, Card, Loader } from '@gutshot/ui';
import { useBroadcasts, useDeleteBroadcastDraft } from '../../entities/broadcast';
import { formatDateTime } from '../../shared/lib/event-labels';

const STATUS_LABEL: Record<BroadcastStatus, string> = {
  DRAFT: 'Черновик',
  SENDING: 'Отправляется',
  SENT: 'Отправлена',
  FAILED: 'Ошибка',
};

const SEGMENT_LABEL: Record<string, string> = {
  ALL_ACTIVE: 'Все активные',
  TOURNAMENT_REGISTERED: 'Записанные на турнир',
  TOURNAMENT_RSVP_PENDING: 'Не подтвердили RSVP',
  SINGLE_PLAYER: 'Один игрок',
};

export function BroadcastsPage(): JSX.Element {
  const { data, isLoading } = useBroadcasts();
  const removeDraft = useDeleteBroadcastDraft();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium">Рассылки</h1>
          <p className="text-sm text-muted-foreground">
            Сообщения игрокам в Telegram: анонсы, RSVP, сегменты
          </p>
        </div>
        <Link
          to="/broadcasts/new"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Создать рассылку
        </Link>
      </div>

      <Card className="gap-4">
        {isLoading ? (
          <Loader />
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-muted-foreground">Пока нет рассылок</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {data.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <Link to={`/broadcasts/${item.id}`} className="text-sm font-medium hover:underline">
                    {item.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {STATUS_LABEL[item.status]} · {SEGMENT_LABEL[item.segment] ?? item.segment}
                    {item.tournament ? ` · ${item.tournament.title}` : ''}
                    {item.targetUser ? ` · ${item.targetUser.name}` : ''}
                    {item.photoUrl ? ' · с фото' : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(item.createdAt)}
                    {item.status === 'SENT'
                      ? ` · доставлено ${item.sentCount}, ошибок ${item.failedCount}`
                      : ` · получателей ≈ ${item.recipientCount}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/broadcasts/${item.id}`}
                    className="inline-flex items-center rounded-md border border-border bg-secondary px-3 py-2 text-sm"
                  >
                    Открыть
                  </Link>
                  {item.status === 'DRAFT' && (
                    <Button
                      variant="secondary"
                      isLoading={removeDraft.isPending}
                      onClick={() => {
                        if (window.confirm('Удалить черновик?')) {
                          removeDraft.mutate(item.id);
                        }
                      }}
                    >
                      Удалить
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
