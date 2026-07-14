import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Loader } from '@gutshot/ui';
import { RatingEntry } from '@gutshot/types';
import { apiClient } from '../../shared/api/client';
import { Logo, SectionLabel, initialsOf } from '../../shared/ui/figma';

type Tab = 'overall' | 'weekly';

async function fetchRating(tab: Tab): Promise<RatingEntry[]> {
  const { data } = await apiClient.get(tab === 'overall' ? '/ratings' : '/ratings/weekly');
  return data.data;
}

function xpOf(entry: RatingEntry): number {
  return entry.xp ?? entry.weeklyXp ?? 0;
}

export function RatingPage(): JSX.Element {
  const [tab, setTab] = useState<Tab>('overall');
  const { data: rating, isLoading } = useQuery({
    queryKey: ['ratings', tab],
    queryFn: () => fetchRating(tab),
  });

  const top3 = (rating ?? []).slice(0, 3);
  const rest = (rating ?? []).slice(3);
  const medalColors = ['#C89A3D', '#9A9A9A', '#B87040'];
  const medals = ['🥇', '🥈', '🥉'];
  const order = [1, 0, 2];

  return (
    <div className="flex flex-col">
      <div className="px-5 pt-6 pb-4">
        <Logo size="sm" />
        <h2 className="serif font-semibold mt-4" style={{ fontSize: 24, color: '#F5EDD6' }}>
          Рейтинг клуба
        </h2>
        <p className="sans mt-1" style={{ fontSize: 12, color: '#6B614E' }}>
          Таблица лидеров сезона
        </p>

        <div
          className="flex rounded-[14px] p-1 gap-1 mt-4"
          style={{ background: '#0F0D09', border: '1px solid rgba(199,154,61,0.15)' }}
        >
          {(['overall', 'weekly'] as Tab[]).map((option) => (
            <button
              key={option}
              onClick={() => setTab(option)}
              className="flex-1 py-2.5 rounded-[10px] sans font-medium transition-all duration-300"
              style={{
                fontSize: 12,
                cursor: 'pointer',
                border: 'none',
                background: tab === option ? 'linear-gradient(135deg, #9C6A1F, #C89A3D)' : 'transparent',
                color: tab === option ? '#0A0A0A' : '#6B614E',
              }}
            >
              {option === 'overall' ? 'Общий' : 'Недельный'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Loader />
      ) : (
        <>
          {top3.length > 0 && (
            <div className="px-5 mb-5">
              <div className="vip-card rounded-[22px] overflow-hidden relative pt-6 pb-4">
                <div className="absolute inset-0 deco-lines opacity-40" />
                <div className="flex items-end justify-center gap-3 px-4 relative">
                  {order
                    .filter((idx) => top3[idx])
                    .map((idx) => {
                      const p = top3[idx];
                      const heights = [90, 68, 52];
                      return (
                        <motion.div
                          key={p.userId}
                          initial={{ opacity: 0, y: 18 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
                          className="flex flex-col items-center flex-1"
                        >
                          <div
                            className="w-14 h-14 rounded-full flex items-center justify-center serif font-semibold text-base mb-2"
                            style={{
                              background: `linear-gradient(135deg, ${medalColors[idx]}22, ${medalColors[idx]}44)`,
                              border: `2px solid ${medalColors[idx]}`,
                              color: medalColors[idx],
                              boxShadow: idx === 0 ? `0 0 18px rgba(199,154,61,0.22)` : 'none',
                            }}
                          >
                            {initialsOf(p.firstName, p.lastName)}
                          </div>
                          <span style={{ fontSize: 15 }}>{medals[idx]}</span>
                          <p
                            className="serif font-medium text-center mt-1 leading-snug"
                            style={{ fontSize: 11, color: '#F5EDD6' }}
                          >
                            {p.firstName} {p.lastName}
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
                            <span className="serif font-bold" style={{ fontSize: 24, color: `${medalColors[idx]}55` }}>
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
            {rest.map((p, i) => (
              <motion.div
                key={p.userId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="flex items-center gap-3 p-4 rounded-[16px]"
                style={{ background: '#141210', border: '1px solid rgba(199,154,61,0.12)' }}
              >
                <span className="num serif font-bold w-6 text-center" style={{ fontSize: 14, color: '#3E3428' }}>
                  {p.rank}
                </span>
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center serif font-semibold"
                  style={{ background: '#221E16', color: '#8A7A62', fontSize: 12 }}
                >
                  {initialsOf(p.firstName, p.lastName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="serif font-medium" style={{ fontSize: 14, color: '#F5EDD6', lineHeight: 1.3 }}>
                    {p.firstName} {p.lastName}
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
            ))}
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
