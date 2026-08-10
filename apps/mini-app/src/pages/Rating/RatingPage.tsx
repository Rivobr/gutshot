import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Loader } from '@gutshot/ui';
import type { RatingEntry, WeeklyRatingResponse } from '@gutshot/types';
import { apiClient } from '../../shared/api/client';
import { useProfile } from '../../entities/player';
import { SectionLabel } from '../../shared/ui/figma';
import { PlayerAvatar } from '../../shared/ui/PlayerAvatar';
import { PlayerLevelBadge, PlayerShowcaseMedals } from '../../shared/ui/PlayerShowcase';
import { displayNameOf } from '../../shared/lib/display-name';

type Tab = 'weekly' | 'final';
type WeekMode = 'auto' | 'previous';

async function fetchFinalRating(): Promise<RatingEntry[]> {
  const { data } = await apiClient.get('/ratings/final');
  const payload = data?.data ?? data;
  return Array.isArray(payload) ? payload : [];
}

async function fetchWeeklyRating(week: WeekMode): Promise<WeeklyRatingResponse> {
  const { data } = await apiClient.get('/ratings/weekly', { params: { week } });
  const payload = data?.data ?? data;
  if (Array.isArray(payload)) {
    return {
      weekKey: '',
      monthKey: '',
      period: week === 'previous' ? 'previous' : 'current',
      fallbackFromEmptyCurrent: false,
      start: '',
      end: '',
      entries: payload,
    };
  }
  return {
    weekKey: String(payload?.weekKey ?? ''),
    monthKey: String(payload?.monthKey ?? ''),
    period: payload?.period === 'previous' ? 'previous' : 'current',
    fallbackFromEmptyCurrent: Boolean(payload?.fallbackFromEmptyCurrent),
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

function formatWeekRange(startIso: string, endIso: string): string {
  if (!startIso || !endIso) return '';
  const start = new Date(startIso);
  const end = new Date(new Date(endIso).getTime() - 1000);
  const fmt = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Europe/Moscow',
  });
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'weekly', label: 'Недельный' },
  { id: 'final', label: 'Финал месяца' },
];

const WEEKLY_TOP = 7;

export function RatingPage(): JSX.Element {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('weekly');
  const [weekMode, setWeekMode] = useState<WeekMode>('auto');
  const { data: profile } = useProfile();

  const weeklyQuery = useQuery({
    queryKey: ['ratings', 'weekly', weekMode],
    queryFn: () => fetchWeeklyRating(weekMode),
    enabled: tab === 'weekly',
  });

  const finalQuery = useQuery({
    queryKey: ['ratings', 'final'],
    queryFn: fetchFinalRating,
    enabled: tab === 'final',
  });

  const weekly = weeklyQuery.data;
  const rating =
    tab === 'weekly'
      ? (weekly?.entries ?? [])
      : Array.isArray(finalQuery.data)
        ? finalQuery.data
        : [];
  const ratingQuery = tab === 'weekly' ? weeklyQuery : finalQuery;
  const myUserId = profile?.id;
  const weekRangeLabel = weekly ? formatWeekRange(weekly.start, weekly.end) : '';
  const showingPrevious = weekly?.period === 'previous';

  const openPlayer = (userId: string) => {
    navigate(userId === myUserId ? '/profile' : `/players/${userId}`);
  };

  const me = useMemo(
    () => (myUserId ? rating.find((entry) => entry.userId === myUserId) : undefined),
    [rating, myUserId],
  );

  const youHere = useMemo(() => {
    if (!myUserId) {
      return null;
    }

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
      const weeks = me.qualifiedWeeks ?? 1;
      return {
        rank: myRank ?? null,
        points: myPoints,
        highlight: true,
        title: myRank === 1 ? 'Вы лидируете в финале' : `Вы в финале · ${myRank} место`,
        subtitle: `Сумма очков за ${weeks} ${weeks === 1 ? 'неделю' : weeks < 5 ? 'недели' : 'недель'} в топ-7`,
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
  const medalColors = ['#C89A3D', '#9A9A9A', '#B87040'];
  const medals = ['🥇', '🥈', '🥉'];
  // Порядок на пьедестале: 2 — 1 — 3; высоты: 1 выше всех
  const order = [1, 0, 2];
  const heights = [108, 84, 64];

  return (
    <div className="flex flex-col">
      <div className="px-5 pt-6 pb-4">
        <h2 className="serif font-semibold" style={{ fontSize: 24, color: '#F5EDD6' }}>
          Рейтинг клуба
        </h2>
        <p className="sans mt-1" style={{ fontSize: 12, color: '#6B614E' }}>
          Топ-7 недели → финал месяца · неделя до воскресенья
        </p>

        <div
          className="flex rounded-[14px] p-1 gap-1 mt-4"
          style={{ background: '#0F0D09', border: '1px solid rgba(199,154,61,0.15)' }}
        >
          {TABS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setTab(option.id)}
              className="flex-1 py-2.5 rounded-[10px] sans font-medium transition-all duration-300"
              style={{
                fontSize: 12,
                cursor: 'pointer',
                border: 'none',
                background:
                  tab === option.id ? 'linear-gradient(135deg, #9C6A1F, #C89A3D)' : 'transparent',
                color: tab === option.id ? '#0A0A0A' : '#6B614E',
              }}
            >
              {option.label}
            </button>
          ))}
        </div>

        {tab === 'weekly' && (
          <div className="mt-3 flex flex-col gap-2">
            <div
              className="flex rounded-[12px] p-1 gap-1"
              style={{ background: '#0F0D09', border: '1px solid rgba(199,154,61,0.1)' }}
            >
              {(
                [
                  { id: 'auto' as const, label: 'Актуальная' },
                  { id: 'previous' as const, label: 'Прошлая' },
                ] as const
              ).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setWeekMode(option.id)}
                  className="flex-1 py-2 rounded-[9px] sans font-medium"
                  style={{
                    fontSize: 11,
                    cursor: 'pointer',
                    border: 'none',
                    background: weekMode === option.id ? 'rgba(199,154,61,0.18)' : 'transparent',
                    color: weekMode === option.id ? '#F5EDD6' : '#6B614E',
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {(weekRangeLabel || showingPrevious) && (
              <p className="sans" style={{ fontSize: 11, color: '#8A7E68' }}>
                {showingPrevious ? 'Прошлая неделя' : 'Текущая неделя'}
                {weekRangeLabel ? ` · ${weekRangeLabel}` : ''}
                {weekly?.fallbackFromEmptyCurrent ? ' · эта неделя ещё без очков' : ''}
              </p>
            )}
          </div>
        )}
      </div>

      {ratingQuery.isLoading ? (
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
                <motion.button
                  type="button"
                  key={p.userId}
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
                    {tab === 'final' && p.qualifiedWeeks != null && (
                      <p className="sans" style={{ fontSize: 10, color: '#6B614E' }}>
                        {p.qualifiedWeeks}{' '}
                        {p.qualifiedWeeks === 1
                          ? 'неделя'
                          : p.qualifiedWeeks < 5
                            ? 'недели'
                            : 'недель'}{' '}
                        в топ-7
                      </p>
                    )}
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
              );
            })}
            {rest.length === 0 && top3.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <span style={{ fontSize: 32, opacity: 0.25 }}>♠</span>
                <p className="serif" style={{ fontSize: 16, color: '#6B614E' }}>
                  {tab === 'weekly' ? 'На этой неделе пока нет очков' : 'Рейтинг пуст'}
                </p>
                {tab === 'weekly' && weekMode === 'auto' && (
                  <button
                    type="button"
                    onClick={() => setWeekMode('previous')}
                    className="sans px-3 py-2 rounded-[10px]"
                    style={{
                      fontSize: 12,
                      color: '#C89A3D',
                      background: 'rgba(199,154,61,0.12)',
                      border: '1px solid rgba(199,154,61,0.25)',
                      cursor: 'pointer',
                    }}
                  >
                    Смотреть прошлую неделю
                  </button>
                )}
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
