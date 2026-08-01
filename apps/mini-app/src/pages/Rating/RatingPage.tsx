import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Loader } from '@gutshot/ui';
import type { RatingEntry } from '@gutshot/types';
import { apiClient } from '../../shared/api/client';
import { useProfile } from '../../entities/player';
import { SectionLabel } from '../../shared/ui/figma';
import { PlayerAvatar } from '../../shared/ui/PlayerAvatar';
import { displayNameOf } from '../../shared/lib/display-name';

type Tab = 'overall' | 'weekly';

async function fetchRating(tab: Tab): Promise<RatingEntry[]> {
  const { data } = await apiClient.get(tab === 'overall' ? '/ratings' : '/ratings/weekly');
  const payload = data?.data ?? data;
  return Array.isArray(payload) ? payload : [];
}

function xpOf(entry: RatingEntry): number {
  return entry.xp ?? entry.weeklyXp ?? 0;
}

function formatPoints(value: number): string {
  return value.toLocaleString('ru-RU');
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'overall', label: 'Общий' },
  { id: 'weekly', label: 'Недельный' },
];

export function RatingPage(): JSX.Element {
  const [tab, setTab] = useState<Tab>('overall');
  const { data: profile } = useProfile();

  const ratingQuery = useQuery({
    queryKey: ['ratings', tab],
    queryFn: () => fetchRating(tab),
  });

  const rating = Array.isArray(ratingQuery.data) ? ratingQuery.data : [];
  const myUserId = profile?.id;

  const me = useMemo(
    () => (myUserId ? rating.find((entry) => entry.userId === myUserId) : undefined),
    [rating, myUserId],
  );

  const youHere = useMemo(() => {
    if (!myUserId) {
      return null;
    }

    const myXp = me ? xpOf(me) : 0;
    const myRank = me?.rank;
    const third = rating[2];
    const first = rating[0];
    const thirdXp = third ? xpOf(third) : 0;
    const firstXp = first ? xpOf(first) : 0;

    if (!me) {
      return {
        rank: null as number | null,
        xp: 0,
        inTop3: false,
        title: 'Вас пока нет в таблице',
        subtitle:
          tab === 'weekly'
            ? 'Сыграйте турнир на этой неделе — и появитесь в рейтинге'
            : 'Наберите первые очки, чтобы попасть в таблицу',
      };
    }

    if (myRank != null && myRank <= 3) {
      const toFirst = Math.max(0, firstXp - myXp);
      return {
        rank: myRank,
        xp: myXp,
        inTop3: true,
        title: myRank === 1 ? 'Вы лидируете' : 'Вы в топ-3',
        subtitle:
          myRank === 1
            ? 'Держите позицию до конца периода'
            : toFirst > 0
              ? `До 1 места: ${formatPoints(toFirst)} очков`
              : 'Вы делите лидерство',
      };
    }

    const toTop3 = Math.max(0, thirdXp - myXp);
    return {
      rank: myRank ?? null,
      xp: myXp,
      inTop3: false,
      title: `Вы на ${myRank} месте`,
      subtitle:
        toTop3 > 0 ? `До топ-3: ${formatPoints(toTop3)} очков` : 'Ещё немного — и вы в тройке',
    };
  }, [me, myUserId, rating, tab]);

  const top3 = rating.slice(0, 3);
  const rest = rating.slice(3);
  const medalColors = ['#C89A3D', '#9A9A9A', '#B87040'];
  const medals = ['🥇', '🥈', '🥉'];
  const order = [1, 0, 2];

  return (
    <div className="flex flex-col">
      <div className="px-5 pt-6 pb-4">
        <h2 className="serif font-semibold" style={{ fontSize: 24, color: '#F5EDD6' }}>
          Рейтинг клуба
        </h2>
        <p className="sans mt-1" style={{ fontSize: 12, color: '#6B614E' }}>
          Таблица лидеров сезона
        </p>

        <div
          className="flex rounded-[14px] p-1 gap-1 mt-4"
          style={{ background: '#0F0D09', border: '1px solid rgba(199,154,61,0.15)' }}
        >
          {TABS.map((option) => (
            <button
              key={option.id}
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
                xp={youHere.xp}
                inTop3={youHere.inTop3}
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
                      const heights = [72, 96, 56];
                      const isMe = p.userId === myUserId;
                      return (
                        <motion.div
                          key={p.userId}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
                          className="flex flex-col items-center flex-1"
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
                          <p className="gold-text-sm num sans font-semibold" style={{ fontSize: 12 }}>
                            {xpOf(p).toLocaleString('ru-RU')}
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
                        </motion.div>
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
                <motion.div
                  key={p.userId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="flex items-center gap-3 p-4 rounded-[16px]"
                  style={{
                    background: isMe
                      ? 'linear-gradient(135deg, rgba(199,154,61,0.16), rgba(20,18,16,0.95))'
                      : '#141210',
                    border: isMe
                      ? '1px solid rgba(247,217,138,0.45)'
                      : '1px solid rgba(199,154,61,0.12)',
                    boxShadow: isMe ? '0 0 24px rgba(156,106,31,0.18)' : undefined,
                  }}
                >
                  <span
                    className="num serif font-bold w-6 text-center"
                    style={{ fontSize: 14, color: isMe ? '#C89A3D' : '#3E3428' }}
                  >
                    {p.rank}
                  </span>
                  <PlayerAvatar
                    photoUrl={p.photoUrl}
                    firstName={p.firstName}
                    lastName={p.lastName}
                    nickname={p.nickname}
                    size={36}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className="serif font-medium flex items-center gap-2"
                      style={{ fontSize: 14, color: '#F5EDD6', lineHeight: 1.3 }}
                    >
                      <span className="truncate">{displayNameOf(p)}</span>
                      {isMe && (
                        <span
                          className="sans shrink-0 rounded-full px-1.5 py-0.5"
                          style={{
                            fontSize: 9,
                            background: 'rgba(199,154,61,0.22)',
                            color: '#C89A3D',
                            letterSpacing: '0.06em',
                          }}
                        >
                          ВЫ
                        </span>
                      )}
                    </p>
                    {p.level != null && (
                      <p className="sans" style={{ fontSize: 10, color: '#6B614E' }}>
                        Уровень {p.level}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="gold-text-sm num sans font-semibold" style={{ fontSize: 13 }}>
                      {xpOf(p).toLocaleString('ru-RU')}
                    </p>
                    <p className="sans num" style={{ fontSize: 9, color: '#6B614E' }}>
                      XP
                    </p>
                  </div>
                </motion.div>
              );
            })}
            {rest.length === 0 && top3.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <span style={{ fontSize: 32, opacity: 0.25 }}>♠</span>
                <p className="serif" style={{ fontSize: 16, color: '#6B614E' }}>
                  Рейтинг пуст
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
  xp,
  inTop3,
}: {
  title: string;
  subtitle: string;
  rank: number | null;
  xp: number;
  inTop3: boolean;
}): JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-[18px] px-4 py-3.5"
      style={{
        background: inTop3
          ? 'linear-gradient(135deg, rgba(199,154,61,0.22), rgba(20,18,16,0.95))'
          : 'linear-gradient(145deg, #1c1916 0%, #141210 100%)',
        border: inTop3
          ? '1px solid rgba(247,217,138,0.4)'
          : '1px solid rgba(199,154,61,0.22)',
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
            {formatPoints(xp)}
          </p>
          <p className="sans" style={{ fontSize: 9, color: '#6B614E' }}>
            XP
          </p>
        </div>
      </div>
    </motion.div>
  );
}
