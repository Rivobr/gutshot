import { Fragment, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { RatingEntry } from '@gutshot/types';
import { ratingApi } from '@/shared/api/public.api';
import { useAuth } from '@/app/providers/auth-provider';
import { displayName, formatPoints, initialsOf } from '@/shared/lib/format';

const FINALIST_TOP = 27;

function pointsOf(entry: RatingEntry): number {
  return entry.points ?? entry.weeklyXp ?? entry.xp ?? 0;
}

function monthLabelFromKey(monthKey?: string): string {
  if (!monthKey) return '';
  const [year, month] = monthKey.split('-').map(Number);
  return new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(
    new Date(Date.UTC(year, (month || 1) - 1, 1)),
  );
}

export function RatingPage() {
  const { user } = useAuth();
  const myUserId = user?.id;

  const monthlyQuery = useQuery({
    queryKey: ['ratings', 'monthly'],
    queryFn: () => ratingApi.monthly('current'),
  });

  const rating: RatingEntry[] = monthlyQuery.data?.entries ?? [];
  const monthLabel = monthLabelFromKey(monthlyQuery.data?.monthKey);

  const me = useMemo(
    () => (myUserId ? rating.find((entry) => entry.userId === myUserId) : undefined),
    [rating, myUserId],
  );

  const youHere = useMemo(() => {
    const myPoints = me ? pointsOf(me) : 0;
    const myRank = me?.rank;
    const cut = rating[FINALIST_TOP - 1];
    const first = rating[0];
    const cutPoints = cut ? pointsOf(cut) : 0;
    const firstPoints = first ? pointsOf(first) : 0;

    if (!me) {
      return {
        rank: null as number | null,
        points: 0,
        highlight: false,
        title: 'Вас пока нет в таблице',
        subtitle: 'Каждый турнир месяца влияет на позицию — играйте и набирайте очки',
      };
    }
    if (myRank != null && myRank <= FINALIST_TOP) {
      const toFirst = Math.max(0, firstPoints - myPoints);
      return {
        rank: myRank,
        points: myPoints,
        highlight: true,
        title: myRank === 1 ? 'Вы лидируете' : `Вы в топ-${FINALIST_TOP}`,
        subtitle:
          myRank === 1
            ? 'Место в Финале месяца у вас'
            : toFirst > 0
              ? `До 1 места: ${formatPoints(toFirst)} очков · зона Финала месяца`
              : 'Зона Финала месяца',
      };
    }
    const toTop = Math.max(0, cutPoints - myPoints + 1);
    return {
      rank: myRank ?? null,
      points: myPoints,
      highlight: false,
      title: `Вы на ${myRank} месте`,
      subtitle:
        toTop > 0
          ? `До топ-${FINALIST_TOP}: ${formatPoints(toTop)} очков`
          : `Ещё немного — и вы в топ-${FINALIST_TOP}`,
    };
  }, [me, rating]);

  const top3 = rating.slice(0, 3);
  const rest = rating.slice(3);
  const nameOf = (p: RatingEntry) => (p.userId === myUserId ? 'Вы' : displayName(p));
  const avatarOf = (p: RatingEntry) =>
    p.photoUrl ? <img src={p.photoUrl} alt="" /> : initialsOf(nameOf(p));

  return (
    <div className="stack-16">
      <header>
        <h1 className="serif" style={{ fontSize: 26 }}>
          Финал месяца
        </h1>
        <p className="muted" style={{ fontSize: 12, marginTop: 2 }}>
          Топ-27 месяца → место в Финале месяца
          {monthLabel ? ` · ${monthLabel}` : ''}
        </p>
      </header>

      {youHere && (
        <div className={`youhere ${youHere.highlight ? '' : 'dim'}`} style={{ maxWidth: 640 }}>
          <div className="yh-rank">{youHere.rank ?? '—'}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="eyebrow" style={{ letterSpacing: '0.16em', fontSize: 8.5 }}>
              Вы здесь
            </p>
            <p className="yh-title">{youHere.title}</p>
            <p className="yh-sub">{youHere.subtitle}</p>
          </div>
          <div style={{ textAlign: 'right', flex: 'none' }}>
            <b className="num" style={{ fontSize: 15, color: 'var(--gold-hi)' }}>
              {formatPoints(youHere.points)}
            </b>
            <p className="muted" style={{ fontSize: 9 }}>
              очков
            </p>
          </div>
        </div>
      )}

      {top3.length > 0 && (
        <div className="vip-card" style={{ padding: '24px 16px 0', maxWidth: 640 }}>
          <div className="deco-lines" style={{ opacity: 0.4 }} />
          <div className="podium" style={{ position: 'relative' }}>
            {[1, 0, 2].map((idx) => {
              const p = top3[idx];
              if (!p) return null;
              const cls = idx === 0 ? 'pod--gold' : idx === 1 ? 'pod--silver' : 'pod--bronze';
              const height = idx === 0 ? 108 : idx === 1 ? 84 : 64;
              const isMe = p.userId === myUserId;
              return (
                <div
                  key={p.userId}
                  className={`pod ${cls} ${isMe ? 'pod--me' : ''} ${idx === 0 ? 'pod--1' : ''}`}
                >
                  <div className="pod-ava" style={{ margin: '0 auto 8px' }}>
                    {avatarOf(p)}
                    {isMe && <span className="pod-you">ВЫ</span>}
                  </div>
                  <p className="pod-name">{nameOf(p)}</p>
                  {p.level != null && <span className="lvl">{p.level} ур.</span>}
                  <p className="pod-pts num">{formatPoints(pointsOf(p))}</p>
                  <div className="pod-col" style={{ height }}>
                    {p.rank}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ maxWidth: 640 }}>
        <p className="eyebrow mb-12">Полная таблица</p>
        {rest.map((p, i) => {
          const isMe = p.userId === myUserId;
          return (
            <Fragment key={p.userId}>
              <div
                className={`rrow ${isMe ? 'me' : ''}`}
                style={{ animationDelay: `${0.15 + i * 0.05}s` }}
              >
                <span className="rk num">{p.rank}</span>
                <div className="ava">{avatarOf(p)}</div>
                <div style={{ minWidth: 0 }}>
                  <p className="nm">{nameOf(p)}</p>
                </div>
                <div className="pts">
                  <b className="num">{formatPoints(pointsOf(p))}</b>
                  <span>очков</span>
                </div>
              </div>
              {p.rank === FINALIST_TOP && (
                <div
                  style={{ height: 2, margin: '4px 0', background: 'rgba(220,48,48,0.7)' }}
                  aria-hidden
                />
              )}
            </Fragment>
          );
        })}

        {rest.length === 0 && top3.length === 0 && (
          <div className="center" style={{ padding: '48px 0' }}>
            <span style={{ fontSize: 32, opacity: 0.25 }}>♠</span>
            <p className="serif muted" style={{ fontSize: 16 }}>
              В этом месяце пока нет очков
            </p>
          </div>
        )}

        {rest.length > 0 && (
          <p className="hint center mt-12">Топ-27 месяца получает место в Финале месяца</p>
        )}
      </div>

      <p className="note gold" style={{ fontSize: 11.5, maxWidth: 640 }}>
        Очки рейтинга ≠ XP. Баунти = 50 очков рейтинга. XP — опыт игрока и уровни, считается
        отдельно.
      </p>
    </div>
  );
}
