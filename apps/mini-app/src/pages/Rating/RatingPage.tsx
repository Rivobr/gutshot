import { Fragment, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Loader } from '@gutshot/ui';
import type { MonthlyRatingResponse, RatingEntry } from '@gutshot/types';
import { apiClient } from '../../shared/api/client';
import { useProfile } from '../../entities/player';
import { SectionLabel } from '../../shared/ui/figma';
import { PlayerAvatar } from '../../shared/ui/PlayerAvatar';
import { PlayerLevelBadge, PlayerShowcaseMedals } from '../../shared/ui/PlayerShowcase';
import { displayNameOf } from '../../shared/lib/display-name';

const FINALIST_TOP = 27;

async function fetchMonthlyRating(): Promise<MonthlyRatingResponse> {
  const { data } = await apiClient.get('/ratings/monthly');
  const payload = data?.data ?? data;
  return {
    monthKey: String(payload?.monthKey ?? ''),
    finalistTop: Number(payload?.finalistTop ?? FINALIST_TOP),
    start: String(payload?.start ?? ''),
    end: String(payload?.end ?? ''),
    entries: Array.isArray(payload?.entries) ? payload.entries : [],
  };
}

function pointsOf(entry: RatingEntry): number {
  return entry.points ?? entry.weeklyXp ?? entry.xp ?? 0;
}

function formatPoints(value: number): string {
  return value.toLocaleString('ru-RU');
}

function monthLabelFromKey(monthKey: string): string {
  if (!monthKey) return '';
  const [year, month] = monthKey.split('-').map(Number);
  return new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(
    new Date(Date.UTC(year, (month || 1) - 1, 1)),
  );
}

export function RatingPage(): JSX.Element {
  const navigate = useNavigate();
  const { data: profile } = useProfile();

  const monthlyQuery = useQuery({
    queryKey: ['ratings', 'monthly'],
    queryFn: fetchMonthlyRating,
  });

  const rating: RatingEntry[] = monthlyQuery.data?.entries ?? [];
  const myUserId = profile?.id;
  const monthLabel = monthLabelFromKey(monthlyQuery.data?.monthKey ?? '');

  const openPlayer = (userId: string) => {
    navigate(userId === myUserId ? '/profile' : `/players/${userId}`);
  };

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
  const medalColors = ['#C89A3D', '#9A9A9A', '#B87040'];
  const medals = ['🥇', '🥈', '🥉'];
  // Порядок на пьедестале: 2 — 1 — 3; высоты: 1 выше всех
  const order = [1, 0, 2];
  const heights = [108, 84, 64];

  return (
    <div className="flex flex-col">
      <div className="px-5 pt-6 pb-4">
        <h2 className="serif font-semibold" style={{ fontSize: 24, color: '#F5EDD6' }}>
          Финал месяца
        </h2>
        <p className="sans mt-1" style={{ fontSize: 12, color: '#6B614E' }}>
          Топ-27 месяца → место в Финале месяца
          {monthLabel ? ` · ${monthLabel}` : ''}
        </p>
      </div>

      {monthlyQuery.isLoading ? (
        <Loader />
      ) : (
        <>
          {youHere && (
            <div className="px-5 mb-4">
              <YouHereCard
                title={youHere.title}
                subtitle={youHere.subtitle}
                rank={youHere.rank}
                points={youHere.points}
                highlight={youHere.highlight}
              />
            </div>
          )}

          {top3.length > 0 && (
            <div className="px-5 mb-5">
              <div className="vip-card rounded-[22px] overflow-hidden relative pt-6 pb-4">
                <div className="absolute inset-0 deco-lines opacity-40" />
                <div className="flex items-end justify-center gap-3 px-4 relative">
                  {order
                    .filter((idx) => top3[idx])
                    .map((idx) => {
                      const p = top3[idx];
                      const isMe = p.userId === myUserId;
                      return (
                        <motion.button
                          type="button"
                          key={p.userId}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => openPlayer(p.userId)}
                          className="flex flex-col items-center flex-1"
                          style={{ cursor: 'pointer', background: 'transparent', border: 'none' }}
                        >
                          <div
                            className="mb-2 relative"
                            style={{
                              borderRadius: 999,
                              boxShadow: isMe
                                ? '0 0 22px rgba(199,154,61,0.45)'
                                : idx === 0
                                  ? '0 0 18px rgba(199,154,61,0.22)'
                                  : 'none',
                              border: `2px solid ${isMe ? '#F7D98A' : medalColors[idx]}`,
                            }}
                          >
                            <PlayerAvatar
                              photoUrl={p.photoUrl}
                              firstName={p.firstName}
                              lastName={p.lastName}
                              nickname={p.nickname}
                              size={56}
                            />
                            {isMe && (
                              <span
                                className="sans absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full px-1.5"
                                style={{
                                  fontSize: 8,
                                  letterSpacing: '0.08em',
                                  background: 'linear-gradient(135deg,#9C6A1F,#C89A3D)',
                                  color: '#0A0A0A',
                                  fontWeight: 600,
                                }}
                              >
                                ВЫ
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: 15 }}>{medals[idx]}</span>
                          <p
                            className="serif font-medium text-center mt-1 leading-snug"
                            style={{ fontSize: 11, color: isMe ? '#F7D98A' : '#F5EDD6' }}
                          >
                            {isMe ? 'Вы' : displayNameOf(p)}
                          </p>
                          {p.level != null && (
                            <div className="mt-0.5 flex justify-center">
                              <PlayerLevelBadge level={p.level} size="xs" />
                            </div>
                          )}
                          {p.showcaseAchievements && p.showcaseAchievements.length > 0 && (
                            <div className="mt-1 flex justify-center">
                              <PlayerShowcaseMedals items={p.showcaseAchievements} size={24} />
                            </div>
                          )}
                          <p
                            className="gold-text-sm num sans font-semibold"
                            style={{ fontSize: 12 }}
                          >
                            {formatPoints(pointsOf(p))}
                          </p>
                          <div
                            className="w-full rounded-t-lg mt-2 flex items-center justify-center"
                            style={{
                              height: heights[idx],
                              background: `linear-gradient(180deg, ${medalColors[idx]}20, ${medalColors[idx]}06)`,
                              border: `1px solid ${medalColors[idx]}35`,
                              borderBottom: 'none',
                            }}
                          >
                            <span
                              className="serif font-bold"
                              style={{ fontSize: 24, color: `${medalColors[idx]}55` }}
                            >
                              {p.rank}
                            </span>
                          </div>
                        </motion.button>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          <div className="px-5 pb-6 flex flex-col gap-2">
            <div className="mb-2">
              <SectionLabel>Полная таблица</SectionLabel>
            </div>
            {rest.map((p, i) => {
              const isMe = p.userId === myUserId;
              return (
                <Fragment key={p.userId}>
                  <motion.button
                    type="button"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => openPlayer(p.userId)}
                    className="flex items-center gap-3 p-4 rounded-[16px] w-full text-left"
                    style={{
                      cursor: 'pointer',
                      background: isMe
                        ? 'linear-gradient(135deg, rgba(199,154,61,0.16), rgba(20,18,16,0.95))'
                        : 'rgba(20,18,16,0.85)',
                      border: isMe
                        ? '1px solid rgba(247,217,138,0.35)'
                        : '1px solid rgba(199,154,61,0.12)',
                    }}
                  >
                    <span
                      className="sans num shrink-0"
                      style={{ width: 28, fontSize: 13, color: '#6B614E' }}
                    >
                      {p.rank}
                    </span>
                    <PlayerAvatar
                      photoUrl={p.photoUrl}
                      firstName={p.firstName}
                      lastName={p.lastName}
                      nickname={p.nickname}
                      size={40}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="serif truncate" style={{ fontSize: 14, color: '#F5EDD6' }}>
                          {isMe ? 'Вы' : displayNameOf(p)}
                        </p>
                        <PlayerLevelBadge level={p.level} size="xs" />
                      </div>
                    </div>
                    {p.showcaseAchievements && p.showcaseAchievements.length > 0 && (
                      <PlayerShowcaseMedals items={p.showcaseAchievements} size={32} />
                    )}
                    <div className="text-right">
                      <p className="gold-text-sm num sans font-semibold" style={{ fontSize: 13 }}>
                        {formatPoints(pointsOf(p))}
                      </p>
                      <p className="sans num" style={{ fontSize: 9, color: '#6B614E' }}>
                        очков
                      </p>
                    </div>
                  </motion.button>
                  {p.rank === FINALIST_TOP && (
                    <div
                      className="my-1"
                      style={{ height: 2, background: 'rgba(220,48,48,0.7)' }}
                      aria-hidden
                    />
                  )}
                </Fragment>
              );
            })}
            {rest.length === 0 && top3.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <span style={{ fontSize: 32, opacity: 0.25 }}>♠</span>
                <p className="serif" style={{ fontSize: 16, color: '#6B614E' }}>
                  В этом месяце пока нет очков
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function YouHereCard({
  title,
  subtitle,
  rank,
  points,
  highlight,
}: {
  title: string;
  subtitle: string;
  rank: number | null;
  points: number;
  highlight: boolean;
}): JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-[18px] px-4 py-3.5"
      style={{
        background: highlight
          ? 'linear-gradient(135deg, rgba(199,154,61,0.22), rgba(20,18,16,0.95))'
          : 'linear-gradient(145deg, #1c1916 0%, #141210 100%)',
        border: highlight ? '1px solid rgba(247,217,138,0.4)' : '1px solid rgba(199,154,61,0.22)',
      }}
    >
      <div className="absolute inset-0 deco-lines opacity-30 pointer-events-none" />
      <div className="relative flex items-center gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full serif font-bold"
          style={{
            background: 'rgba(199,154,61,0.12)',
            border: '1px solid rgba(199,154,61,0.35)',
            color: '#C89A3D',
            fontSize: rank ? 16 : 14,
          }}
        >
          {rank ?? '—'}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="sans uppercase"
            style={{ fontSize: 8.5, color: '#6B614E', letterSpacing: '0.16em' }}
          >
            Вы здесь
          </p>
          <p className="serif font-semibold truncate" style={{ fontSize: 16, color: '#F5EDD6' }}>
            {title}
          </p>
          <p className="sans mt-0.5" style={{ fontSize: 12, color: '#C0B49A', lineHeight: 1.4 }}>
            {subtitle}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="gold-text-sm num sans font-semibold" style={{ fontSize: 15 }}>
            {formatPoints(points)}
          </p>
          <p className="sans" style={{ fontSize: 9, color: '#6B614E' }}>
            очков
          </p>
        </div>
      </div>
    </motion.div>
  );
}
