import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { RatingEntry } from '@gutshot/types';
import { ratingApi } from '@/shared/api/public.api';
import { useAuth } from '@/app/providers/auth-provider';
import { displayName, formatPoints, formatWeekRange, initialsOf } from '@/shared/lib/format';

type Tab = 'weekly' | 'final';
type WeekMode = 'current' | 'previous';

const WEEKLY_TOP = 7;
const MEDAL = ['🥇', '🥈', '🥉'];

function pointsOf(entry: RatingEntry): number {
  return entry.points ?? entry.weeklyXp ?? entry.xp ?? 0;
}

/** «финалист 2-й недели», «финалист 1-й и 2-й недели» — как в боте. */
function finalistWeekLine(weekNumbers?: number[]): string {
  const weeks = [...new Set(weekNumbers ?? [])].filter((n) => n > 0).sort((a, b) => a - b);
  if (weeks.length === 0) return '';
  if (weeks.length === 1) return `финалист ${weeks[0]}-й недели`;
  const last = weeks[weeks.length - 1];
  const head = weeks
    .slice(0, -1)
    .map((n) => `${n}-й`)
    .join(', ');
  return `финалист ${head} и ${last}-й недели`;
}

function finalistWeekSubtitle(weekNumbers?: number[], fallbackCount = 1): string {
  const weeks = [...new Set(weekNumbers ?? [])].filter((n) => n > 0).sort((a, b) => a - b);
  if (weeks.length === 1) return `Очки за ${weeks[0]}-ю неделю в топ-7`;
  if (weeks.length > 1) {
    const last = weeks[weeks.length - 1];
    const head = weeks
      .slice(0, -1)
      .map((n) => `${n}-ю`)
      .join(', ');
    return `Сумма очков за ${head} и ${last}-ю недели в топ-7`;
  }
  const noun = fallbackCount === 1 ? 'неделю' : fallbackCount < 5 ? 'недели' : 'недель';
  return `Сумма очков за ${fallbackCount} ${noun} в топ-7`;
}

export function RatingPage() {
  const [tab, setTab] = useState<Tab>('weekly');
  const [weekMode, setWeekMode] = useState<WeekMode>('current');
  const { user } = useAuth();
  const myUserId = user?.id;

  const weeklyQuery = useQuery({
    queryKey: ['ratings', 'weekly', weekMode],
    queryFn: () => ratingApi.weekly(weekMode),
    enabled: tab === 'weekly',
  });
  const finalQuery = useQuery({
    queryKey: ['ratings', 'final'],
    queryFn: ratingApi.final,
    enabled: tab === 'final',
  });

  const rating: RatingEntry[] =
    tab === 'weekly' ? (weeklyQuery.data?.entries ?? []) : (finalQuery.data ?? []);

  const me = useMemo(
    () => (myUserId ? rating.find((entry) => entry.userId === myUserId) : undefined),
    [rating, myUserId],
  );

  const weekRangeLabel = weeklyQuery.data
    ? formatWeekRange(weeklyQuery.data.start, weeklyQuery.data.end)
    : '';
  const showingPrevious = weeklyQuery.data?.period === 'previous';

  const youHere = useMemo(() => {
    if (!myUserId) return null;
    const myPoints = me ? pointsOf(me) : 0;
    const myRank = me?.rank;
    const cut = rating[WEEKLY_TOP - 1];
    const first = rating[0];
    const cutPoints = cut ? pointsOf(cut) : 0;
    const firstPoints = first ? pointsOf(first) : 0;

    if (!me) {
      return {
        rank: null as number | null,
        points: 0,
        highlight: false,
        title: 'Вас пока нет в таблице',
        subtitle:
          tab === 'weekly'
            ? 'Сыграйте турнир на этой неделе — топ-7 переходит в финал месяца'
            : 'Попадите в топ-7 недели — и ваши очки перейдут в финал',
      };
    }
    if (tab === 'final') {
      return {
        rank: myRank ?? null,
        points: myPoints,
        highlight: true,
        title: myRank === 1 ? 'Вы лидируете в финале' : `Вы в финале · ${myRank} место`,
        subtitle: finalistWeekSubtitle(me.qualifiedWeekNumbers, me.qualifiedWeeks ?? 1),
      };
    }
    if (myRank != null && myRank <= WEEKLY_TOP) {
      const toFirst = Math.max(0, firstPoints - myPoints);
      return {
        rank: myRank,
        points: myPoints,
        highlight: true,
        title: myRank === 1 ? 'Вы лидируете' : `Вы в топ-${WEEKLY_TOP}`,
        subtitle:
          myRank === 1
            ? 'Ваши очки перейдут в финал месяца'
            : toFirst > 0
              ? `До 1 места: ${formatPoints(toFirst)} очков · квалификация в финал`
              : 'Квалификация в финал месяца',
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
          ? `До топ-${WEEKLY_TOP}: ${formatPoints(toTop)} очков`
          : `Ещё немного — и вы в топ-${WEEKLY_TOP}`,
    };
  }, [me, myUserId, rating, tab]);

  const top3 = rating.slice(0, 3);
  const rest = rating.slice(3);
  const nameOf = (p: RatingEntry) => (p.userId === myUserId ? 'Вы' : displayName(p));
  const avatarOf = (p: RatingEntry) =>
    p.photoUrl ? <img src={p.photoUrl} alt="" /> : initialsOf(nameOf(p));

  return (
    <div className="stack-16">
      <header>
        <h1 className="serif" style={{ fontSize: 26 }}>
          Рейтинг клуба
        </h1>
        <p className="muted" style={{ fontSize: 12, marginTop: 2 }}>
          Топ-7 недели → финал месяца · неделя пн–сб
        </p>
      </header>

      <div className="seg" style={{ maxWidth: 480 }}>
        <button className={tab === 'weekly' ? 'on' : ''} onClick={() => setTab('weekly')}>
          Недельный
        </button>
        <button className={tab === 'final' ? 'on' : ''} onClick={() => setTab('final')}>
          Финал месяца
        </button>
      </div>

      {tab === 'weekly' && (
        <div className="stack-16" style={{ maxWidth: 480 }}>
          <div className="seg seg--sm">
            <button
              className={weekMode === 'current' ? 'on' : ''}
              onClick={() => setWeekMode('current')}
            >
              Актуальная
            </button>
            <button
              className={weekMode === 'previous' ? 'on' : ''}
              onClick={() => setWeekMode('previous')}
            >
              Прошлая
            </button>
          </div>
          {(weekRangeLabel || showingPrevious) && (
            <p className="muted" style={{ fontSize: 11, color: '#8a7e68', marginTop: -6 }}>
              {showingPrevious ? 'Прошлая неделя' : 'Текущая неделя'}
              {weekRangeLabel ? ` · ${weekRangeLabel}` : ''}
            </p>
          )}
        </div>
      )}

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
                  {tab === 'final' && (
                    <p className="fl muted" style={{ fontSize: 10 }}>
                      {finalistWeekLine(p.qualifiedWeekNumbers)}
                    </p>
                  )}
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
            <div
              key={p.userId}
              className={`rrow ${isMe ? 'me' : ''}`}
              style={{ animationDelay: `${0.15 + i * 0.05}s` }}
            >
              <span className="rk num">{p.rank}</span>
              <div className="ava">{avatarOf(p)}</div>
              <div style={{ minWidth: 0 }}>
                <p className="nm">{nameOf(p)}</p>
                {tab === 'final' && (
                  <p className="fl">
                    {finalistWeekLine(p.qualifiedWeekNumbers) || `${p.qualifiedWeeks ?? 1} в топ-7`}
                  </p>
                )}
              </div>
              <div className="pts">
                <b className="num">{formatPoints(pointsOf(p))}</b>
                <span>очков</span>
              </div>
            </div>
          );
        })}

        {rest.length === 0 && top3.length === 0 && (
          <div className="center" style={{ padding: '48px 0' }}>
            <span style={{ fontSize: 32, opacity: 0.25 }}>♠</span>
            <p className="serif muted" style={{ fontSize: 16 }}>
              {tab === 'weekly' ? 'На этой неделе пока нет очков' : 'Рейтинг пуст'}
            </p>
            {tab === 'weekly' && weekMode === 'current' && (
              <button
                className="btn btn-ghost btn-sm mt-12"
                onClick={() => setWeekMode('previous')}
              >
                Смотреть прошлую неделю
              </button>
            )}
          </div>
        )}

        {tab === 'weekly' && rest.length > 0 && (
          <p className="hint center mt-12">Топ-7 недели переходит в финал месяца</p>
        )}
        {tab === 'final' && (
          <div className="note mt-16" style={{ fontSize: 11.5 }}>
            Новые игроки сайта появляются в финале месяца только после первой сыгранной игры в
            клубе. Итог таблицы — после закрытия последней недели (ночь с субботы).
          </div>
        )}
      </div>

      <p className="note gold" style={{ fontSize: 11.5, maxWidth: 640 }}>
        Очки рейтинга ≠ XP. Баунти = 50 очков рейтинга. XP — опыт игрока и уровни, считается
        отдельно.
      </p>
    </div>
  );
}
