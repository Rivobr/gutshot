import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Loader } from '@gutshot/ui';
import { useAchievementTexts, useAchievements, useProfile } from '../../entities/player';
import {
  mergeAchievementTexts,
  RARITY_STYLE,
  sortAchievementsByAvailability,
  type AchievementContext,
} from '../../shared/lib/achievements-catalog';

export function AchievementsPage(): JSX.Element {
  const navigate = useNavigate();
  const { data: profile, isLoading } = useProfile();
  const { data: unlockedAchievements } = useAchievements();
  const { data: achievementTexts } = useAchievementTexts();
  const catalog = useMemo(() => mergeAchievementTexts(achievementTexts), [achievementTexts]);

  if (isLoading || !profile) {
    return <Loader />;
  }

  const ctx: AchievementContext = {
    visits: profile.stats.visits ?? 0,
    wins: profile.stats.wins,
    finalTables: profile.stats.finalTables ?? 0,
    winStreak: profile.stats.winStreak ?? 0,
    bounties: profile.stats.bounties ?? 0,
    fourOfAKind: profile.stats.fourOfAKind ?? 0,
    unlockedCodes: new Set((unlockedAchievements ?? []).map((item) => item.code)),
  };

  const sorted = sortAchievementsByAvailability(catalog, ctx);
  const unlockedCount = catalog.filter((item) => item.getProgress(ctx) >= item.target).length;

  return (
    <div className="flex flex-col pb-8 relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 80% 0%, rgba(199,154,61,0.12) 0%, transparent 45%), radial-gradient(ellipse at 10% 100%, rgba(199,154,61,0.06) 0%, transparent 40%)',
        }}
      />

      <div className="relative px-5 pt-6 pb-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="sans mb-4"
          style={{
            color: 'rgba(199,154,61,0.7)',
            fontSize: 12,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          ← Назад
        </button>

        <p
          className="sans uppercase"
          style={{ fontSize: 11, color: '#C89A3D', letterSpacing: '0.22em', fontWeight: 600 }}
        >
          Система достижений
        </p>
        <h2
          className="serif font-semibold mt-1.5"
          style={{ fontSize: 26, color: '#F5EDD6', lineHeight: 1.15 }}
        >
          Собирай достижения
        </h2>
        <p className="sans mt-2" style={{ fontSize: 13, color: '#8A7A62', lineHeight: 1.45 }}>
          Получай XP и повышай уровень в клубе · {unlockedCount} из {catalog.length}
        </p>
      </div>

      <div className="relative px-4 grid grid-cols-2 gap-2.5">
        {sorted.map((item, index) => {
          const progress = item.getProgress(ctx);
          const done = progress >= item.target;
          const rarity = RARITY_STYLE[item.rarity];

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
              className="relative rounded-[18px] p-3.5 flex flex-col"
              style={{
                gridColumn: item.span2 ? '1 / -1' : undefined,
                minHeight: item.span2 ? 148 : 168,
                background: done
                  ? `linear-gradient(160deg, rgba(199,154,61,0.2), rgba(14,12,9,0.96))`
                  : 'linear-gradient(160deg, rgba(28,24,20,0.95), rgba(12,10,8,0.98))',
                border: `1px solid ${done ? rarity.border : 'rgba(199,154,61,0.12)'}`,
                boxShadow: done ? rarity.glow : 'none',
              }}
            >
              {!done && (
                <span
                  className="absolute top-2.5 right-2.5"
                  style={{ fontSize: 12, opacity: 0.55 }}
                >
                  🔒
                </span>
              )}

              <div className={`flex ${item.span2 ? 'flex-row items-center gap-4' : 'flex-col'}`}>
                <div
                  className="flex items-center justify-center rounded-[14px] mb-3 shrink-0"
                  style={{
                    width: item.span2 ? 56 : 48,
                    height: item.span2 ? 56 : 48,
                    marginBottom: item.span2 ? 0 : undefined,
                    fontSize: item.span2 ? 28 : 24,
                    background: done ? 'rgba(199,154,61,0.14)' : 'rgba(199,154,61,0.05)',
                    border: `1px solid ${rarity.border}`,
                    filter: done ? 'none' : 'grayscale(1)',
                    opacity: done ? 1 : 0.55,
                  }}
                >
                  {item.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className="sans uppercase"
                    style={{ fontSize: 9, color: rarity.accent, letterSpacing: '0.14em' }}
                  >
                    {rarity.label}
                  </p>
                  <p
                    className="serif font-semibold uppercase"
                    style={{
                      fontSize: item.span2 ? 18 : 13,
                      color: done ? '#F5EDD6' : '#8A7A62',
                      letterSpacing: '0.04em',
                      lineHeight: 1.2,
                    }}
                  >
                    {item.title}
                  </p>
                  <p
                    className="sans mt-1"
                    style={{
                      fontSize: 11,
                      color: done ? '#C0B49A' : '#5C5346',
                      lineHeight: 1.35,
                    }}
                  >
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <span
                  className="sans num font-semibold"
                  style={{
                    fontSize: 12,
                    color: done ? rarity.accent : '#6B614E',
                    letterSpacing: '0.04em',
                  }}
                >
                  XP {item.xp}
                </span>
                <span
                  className="sans"
                  style={{
                    fontSize: 10,
                    color: done ? '#C89A3D' : '#4A4338',
                    fontWeight: 600,
                  }}
                >
                  {done ? 'Получено' : `${progress}/${item.target}`}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div
        className="relative mx-4 mt-5 rounded-[18px] p-4"
        style={{
          background: 'linear-gradient(135deg, rgba(199,154,61,0.12), rgba(14,12,9,0.95))',
          border: '1px solid rgba(199,154,61,0.22)',
        }}
      >
        <p
          className="sans uppercase"
          style={{ fontSize: 10, color: '#C89A3D', letterSpacing: '0.14em', fontWeight: 600 }}
        >
          Привилегии
        </p>
        <p className="sans mt-1.5" style={{ fontSize: 13, color: '#D8CEBC', lineHeight: 1.45 }}>
          Чем больше достижений — тем выше уровень и больше привилегий: поощрения, приглашения на
          мероприятия и особый статус.
        </p>
      </div>
    </div>
  );
}
