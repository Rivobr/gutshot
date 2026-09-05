import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiErrorMessage, apiGet } from '@/shared/api/client';
import { tournamentsApi } from '@/shared/api/public.api';
import { formatDateShort, formatTime } from '@/shared/lib/format';
import { useAuth } from '@/app/providers/auth-provider';

interface TournamentParticipant {
  userId: string;
  nickname?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  status?: string;
}

export function TournamentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState<string | null>(null);
  const { data: tournament } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => tournamentsApi.byId(id!),
    enabled: Boolean(id),
  });
  const { data: participants } = useQuery({
    queryKey: ['tournament-participants', id],
    queryFn: () => apiGet<TournamentParticipant[]>(`/tournaments/${id}/participants`),
    enabled: Boolean(id),
  });

  const myRegistration = participants?.find((p) => p.userId === user?.id);
  const activeStatuses = ['REGISTERED', 'CHECKED_IN', 'PLAYING', 'WAITING'];
  const alreadyIn = Boolean(myRegistration && activeStatuses.includes(myRegistration.status ?? ''));

  const register = useMutation({
    mutationFn: () => tournamentsApi.register(id!),
    onSuccess: (reg) => {
      setNotice(
        reg.status === 'WAITING'
          ? 'Свободных мест нет — вы в листе ожидания'
          : 'Вы записаны на турнир',
      );
      void queryClient.invalidateQueries({ queryKey: ['tournament-participants', id] });
      void queryClient.invalidateQueries({ queryKey: ['tournament', id] });
    },
    onError: (error) => {
      setNotice(apiErrorMessage(error, 'Не удалось записаться. Попробуйте ещё раз.'));
      void queryClient.invalidateQueries({ queryKey: ['tournament-participants', id] });
    },
  });

  if (!tournament) {
    return <p className="muted">Загружаем турнир…</p>;
  }

  const taken = tournament._count?.registrations ?? participants?.length ?? 0;
  const max = tournament.maxPlayers ?? 40;
  const seated = Math.min(taken, max);
  const waiting = Math.max(taken - max, 0);

  return (
    <div className="stack-16">
      <article className="vip-card" style={{ padding: 24 }}>
        <span className="suit-wm">♦</span>
        <div className="row between wrap mb-16">
          <span className="chip chip-live">● СКОРО</span>
          <span className="chip">
            🕐 {formatDateShort(tournament.date)} / {formatTime(tournament.date)}
          </span>
        </div>
        <p className="eyebrow">Турнир клуба</p>
        <h1
          className="serif"
          style={{ fontSize: 'clamp(26px, 6vw, 40px)', marginTop: 6, textTransform: 'uppercase' }}
        >
          {tournament.title}
        </h1>
        <div className="row wrap mt-16" style={{ gap: 10 }}>
          <span className="chip">
            👥 {seated} / {max}
            {waiting > 0 ? ` · +${waiting} в листе ожидания` : ''}
          </span>
          <span className="chip">💰 {tournament.buyIn > 0 ? `${tournament.buyIn} ₽` : 'Free'}</span>
          <span className="chip">Миллионная, 19</span>
        </div>
        {tournament.description && (
          <p className="muted-strong mt-16" style={{ fontSize: 13.5 }}>
            {tournament.description}
          </p>
        )}
        <div className="mt-16">
          <div className="row between mb-8">
            <span className="muted">Мест занято</span>
            <b className="num">
              {seated} / {max}
            </b>
          </div>
          <div className="xp-bar">
            <i style={{ width: `${Math.min(100, Math.round((seated / max) * 100))}%` }} />
          </div>
          {waiting > 0 && (
            <p className="hint mt-8" style={{ color: 'var(--gold)' }}>
              +{waiting} в листе ожидания
            </p>
          )}
        </div>
        <div className="mt-16">
          {alreadyIn ? (
            <p className="note gold center" style={{ margin: 0 }}>
              {myRegistration?.status === 'WAITING'
                ? '⏳ Вы в листе ожидания'
                : '✓ Вы записаны на турнир'}
            </p>
          ) : (
            <button
              type="button"
              className="btn btn-gold btn-block"
              disabled={register.isPending}
              onClick={() => register.mutate()}
            >
              {register.isPending ? 'Записываем…' : 'Записаться на турнир'}
            </button>
          )}
          {notice && (
            <p className="hint center mt-8" style={{ margin: '8px 0 0' }}>
              {notice}
            </p>
          )}
          <p className="hint mt-12" style={notice ? { marginTop: 6 } : undefined}>
            QR для входа — в разделе «QR». Можно прийти и без записи.
          </p>
        </div>
      </article>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="row between" style={{ padding: '18px 22px 0' }}>
          <b className="serif" style={{ fontSize: 16 }}>
            Участники · {taken}
          </b>
        </div>
        <table className="tbl mt-12">
          <thead>
            <tr>
              <th>#</th>
              <th>Игрок</th>
              <th className="r">Статус</th>
            </tr>
          </thead>
          <tbody>
            {(participants ?? []).map((p, i) => (
              <tr key={p.userId}>
                <td className="rank">{i + 1}</td>
                <td>
                  {p.nickname ?? [p.firstName, p.lastName].filter(Boolean).join(' ') ?? 'Игрок'}
                </td>
                <td className="r muted" style={{ fontSize: 12 }}>
                  {statusLabel(p.status)}
                </td>
              </tr>
            ))}
            {participants?.length === 0 && (
              <tr>
                <td colSpan={3} className="center muted" style={{ fontSize: 12.5 }}>
                  Пока никто не записался — будьте первым
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function statusLabel(status?: string): string {
  switch (status) {
    case 'REGISTERED':
      return 'записан';
    case 'CHECKED_IN':
      return 'в клубе';
    case 'PLAYING':
      return 'играет';
    case 'FINISHED':
      return 'финишировал';
    case 'CANCELLED':
      return 'отменил';
    case 'NO_SHOW':
      return 'не явился';
    default:
      return status?.toLowerCase() ?? '—';
  }
}
