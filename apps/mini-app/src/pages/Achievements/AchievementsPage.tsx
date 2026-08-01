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
    tournamentsPlayed: profile.stats.tournamentsPlayed,
    wins: profile.stats.wins,
    itm: profile.stats.itm,
    firstPlaces: profile.stats.firstPlaces,
    bounties: profile.stats.bounties ?? 0,
    daysInClub: profile.stats.daysInClub,
    unlockedCodes: new Set((unlockedAchievements ?? []).map((item) => item.code)),
  };

  const unlockedCount = catalog.filter(
    (item) => item.getProgress(ctx) >= item.target,
  ).length;

  return (
    <div className="flex flex-col pb-8">
      <div className="px-5 pt-6 pb-4">
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
        <h2 className="serif font-semibold" style={{ fontSize: 24, color: '#F5EDD6' }}>
          Достижения
        </h2>
        <p className="sans mt-1" style={{ fontSize: 14, color: '#6B614E' }}>
          Получено {unlockedCount} из {catalog.length} · связаны с XP и уровнем
        </p>
      </div>

      <div className="px-5 flex flex-col gap-3">
        {catalog.map((item, index) => {
          const progress = item.getProgress(ctx);
          const done = progress >= item.target;
          const pct = Math.min(100, Math.round((progress / item.target) * 100));

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.04 }}
              className="vip-card rounded-[18px] p-4"
              style={{
                opacity: done ? 1 : 0.92,
                border: done
                  ? '1px solid rgba(199,154,61,0.35)'
                  : '1px solid rgba(199,154,61,0.12)',
              }}
            >
              <div className="flex items-start gap-3">
                <span
                  className="shrink-0 flex items-center justify-center rounded-[14px]"
                  style={{
                    width: 52,
                    height: 52,
                    fontSize: 24,
                    background: 'rgba(199,154,61,0.08)',
                    border: '1px solid rgba(199,154,61,0.2)',
                    filter: done ? 'none' : 'grayscale(0.7)',
                  }}
                >
                  {done ? item.icon : '🔒'}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="serif font-semibold" style={{ fontSize: 18, color: '#F5EDD6' }}>
                      {item.title}
                    </p>
                    <span
                      className="sans shrink-0"
                      style={{
                        fontSize: 12,
                        color: done ? '#C89A3D' : '#6B614E',
                        letterSpacing: '0.06em',
                        fontWeight: 600,
                      }}
                    >
                      {done ? 'Получено' : `${progress}/${item.target}`}
                    </span>
                  </div>
                  <p className="sans mt-1.5" style={{ fontSize: 14, color: '#C0B49A', lineHeight: 1.5 }}>
                    {item.description}
                  </p>
                  <div
                    className="mt-3 rounded-[14px] px-3 py-2.5"
                    style={{
                      background: 'rgba(199,154,61,0.06)',
                      border: '1px solid rgba(199,154,61,0.16)',
                    }}
                  >
                    <p
                      className="sans uppercase mb-1"
                      style={{ fontSize: 11, color: '#C89A3D', letterSpacing: '0.12em' }}
                    >
                      Как получить
                    </p>
                    <p className="sans" style={{ fontSize: 14, color: '#D8CEBC', lineHeight: 1.55 }}>
                      {item.howTo}
                    </p>
                  </div>
                  <div
                    className="mt-3 rounded-full overflow-hidden"
                    style={{ height: 6, background: 'rgba(199,154,61,0.12)' }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: done
                          ? 'linear-gradient(90deg, #9C6A1F, #C89A3D)'
                          : 'linear-gradient(90deg, #5a4a2a, #8a7340)',
                        borderRadius: 99,
                      }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
