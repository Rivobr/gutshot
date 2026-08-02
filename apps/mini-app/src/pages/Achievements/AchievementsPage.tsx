import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Loader } from '@gutshot/ui';
import {
  useAchievementTexts,
  useAchievements,
  useProfile,
} from '../../entities/player';
import {
  mergeAchievementTexts,
  type AchievementContext,
} from '../../shared/lib/achievements-catalog';
import { AchievementMedallion } from '../../shared/ui/AchievementMedallion';

export function AchievementsPage(): JSX.Element {
  const navigate = useNavigate();
  const { data: profile, isLoading } = useProfile();
  const { data: unlockedAchievements } = useAchievements();
  const { data: achievementTexts } = useAchievementTexts();
  const catalog = useMemo(
    () => mergeAchievementTexts(achievementTexts),
    [achievementTexts],
  );

  if (isLoading || !profile) {
    return <Loader />;
  }

  const ctx: AchievementContext = {
    visits: profile.stats.visits ?? 0,
    wins: profile.stats.wins,
    finalTables: profile.stats.finalTables ?? 0,
    winStreak: profile.stats.winStreak ?? 0,
    bounties: profile.stats.bounties ?? 0,
    unlockedCodes: new Set((unlockedAchievements ?? []).map((item) => item.code)),
  };

  const unlockedCount = catalog.filter(
    (item) => item.getProgress(ctx) >= item.target,
  ).length;

  return (
    <div
      className="flex flex-col pb-10 relative overflow-hidden min-h-full"
      style={{
        background:
          'radial-gradient(ellipse at 50% 0%, rgba(90,55,12,0.45) 0%, transparent 42%), linear-gradient(180deg, #120e09 0%, #090907 40%, #0c0a08 100%)',
      }}
    >
      {/* текстура постера */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(247,217,138,0.35) 2px, rgba(247,217,138,0.35) 3px)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 18%, rgba(199,154,61,0.16) 0%, transparent 38%)',
        }}
      />

      <div className="relative px-4 pt-5 pb-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="sans mb-3"
          style={{
            color: 'rgba(199,154,61,0.75)',
            fontSize: 12,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          ← Назад
        </button>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="text-center px-1"
        >
          <h1
            className="serif font-semibold uppercase"
            style={{
              fontSize: 28,
              lineHeight: 1.05,
              letterSpacing: '0.04em',
              background: 'linear-gradient(180deg, #F7D98A 0%, #C89A3D 55%, #8A5C1C 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 2px 12px rgba(199,154,61,0.35))',
            }}
          >
            Система достижений
          </h1>
          <p
            className="sans uppercase mt-2.5 mx-auto"
            style={{
              maxWidth: 320,
              fontSize: 10,
              color: 'rgba(247,217,138,0.72)',
              letterSpacing: '0.12em',
              lineHeight: 1.55,
              fontWeight: 600,
            }}
          >
            Собирай достижения, получай XP и повышай свой уровень в клубе
          </p>
          <p
            className="sans mt-2"
            style={{ fontSize: 11, color: '#6B614E', letterSpacing: '0.06em' }}
          >
            {unlockedCount} / {catalog.length}
          </p>
        </motion.div>
      </div>

      <div className="relative px-3 grid grid-cols-2 gap-2.5">
        {catalog.map((item, index) => {
          const progress = item.getProgress(ctx);
          const done = progress >= item.target;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.42,
                delay: 0.05 + index * 0.035,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="relative flex flex-col items-center text-center px-2.5 pt-3.5 pb-3"
              style={{
                minHeight: 178,
                borderRadius: 16,
                background: done
                  ? 'linear-gradient(165deg, rgba(72,48,14,0.75) 0%, rgba(18,14,10,0.96) 55%, rgba(10,8,6,0.98) 100%)'
                  : 'linear-gradient(165deg, rgba(32,26,18,0.92) 0%, rgba(12,10,8,0.98) 100%)',
                border: done
                  ? '1px solid rgba(247,217,138,0.42)'
                  : '1px solid rgba(120,95,50,0.28)',
                boxShadow: done
                  ? 'inset 0 1px 0 rgba(247,217,138,0.18), 0 8px 20px rgba(0,0,0,0.35)'
                  : 'inset 0 1px 0 rgba(255,255,255,0.03)',
              }}
            >
              {!done && (
                <span
                  className="absolute top-2 right-2 flex items-center justify-center"
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 999,
                    background: 'rgba(0,0,0,0.45)',
                    border: '1px solid rgba(199,154,61,0.25)',
                    color: '#8A7A62',
                    fontSize: 9,
                  }}
                  aria-label="Заблокировано"
                >
                  🔒
                </span>
              )}

              <AchievementMedallion id={item.id} locked={!done} size={72} />

              <p
                className="serif font-semibold uppercase mt-2.5"
                style={{
                  fontSize: 12,
                  letterSpacing: '0.06em',
                  lineHeight: 1.2,
                  color: done ? '#F5EDD6' : '#7A6E5A',
                }}
              >
                {item.title}
              </p>
              <p
                className="sans mt-1 flex-1"
                style={{
                  fontSize: 10.5,
                  lineHeight: 1.35,
                  color: done ? '#C0B49A' : '#564C3E',
                }}
              >
                {item.description}
              </p>

              <p
                className="sans num font-semibold mt-2"
                style={{
                  fontSize: 12,
                  letterSpacing: '0.08em',
                  color: done ? '#F7D98A' : '#5C5346',
                }}
              >
                XP {item.xp}
              </p>
              {!done && item.target > 1 && (
                <p className="sans mt-0.5" style={{ fontSize: 9, color: '#4A4338' }}>
                  {progress}/{item.target}
                </p>
              )}
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.4 }}
        className="relative mx-3 mt-4 rounded-[16px] px-4 py-3.5 text-center"
        style={{
          background: 'linear-gradient(135deg, rgba(199,154,61,0.14), rgba(14,12,9,0.95))',
          border: '1px solid rgba(199,154,61,0.28)',
        }}
      >
        <p
          className="sans uppercase"
          style={{ fontSize: 10, color: '#C89A3D', letterSpacing: '0.16em', fontWeight: 700 }}
        >
          Привилегии
        </p>
        <p className="sans mt-1.5" style={{ fontSize: 12, color: '#D8CEBC', lineHeight: 1.45 }}>
          Чем больше достижений — тем выше уровень и больше привилегий в клубе.
        </p>
      </motion.div>
    </div>
  );
}
