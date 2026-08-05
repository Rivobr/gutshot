import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader } from '@gutshot/ui';
import {
  useAchievementTexts,
  useAchievements,
  usePinAchievements,
  useProfile,
} from '../../entities/player';
import {
  mergeAchievementTexts,
  RARITY_STYLE,
  sortAchievementsByAvailability,
  type AchievementContext,
  type AchievementDef,
} from '../../shared/lib/achievements-catalog';
import { AchievementMedallion } from '../../shared/ui/AchievementMedallion';
import { BackButton } from '../../shared/ui/BackButton';

/** Столько же, сколько принимает API (MAX_PINNED_ACHIEVEMENTS). */
const MAX_PINNED = 3;

export function AchievementsPage(): JSX.Element {
  const { data: profile, isLoading } = useProfile();
  const { data: unlockedAchievements } = useAchievements();
  const { data: achievementTexts } = useAchievementTexts();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const pinAchievements = usePinAchievements();
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

  const selected = selectedId ? (catalog.find((item) => item.id === selectedId) ?? null) : null;
  const selectedProgress = selected ? selected.getProgress(ctx) : 0;
  const selectedDone = selected ? selectedProgress >= selected.target : false;

  const pinnedIds = profile.pinnedAchievements ?? [];

  const togglePinned = (id: string) => {
    const next = pinnedIds.includes(id)
      ? pinnedIds.filter((item) => item !== id)
      : [...pinnedIds, id].slice(-MAX_PINNED);
    pinAchievements.mutate(next);
  };

  return (
    <div
      className="flex flex-col pb-10 relative overflow-hidden min-h-full"
      style={{
        background:
          'radial-gradient(ellipse at 50% 0%, rgba(90,55,12,0.45) 0%, transparent 42%), linear-gradient(180deg, #120e09 0%, #090907 40%, #0c0a08 100%)',
      }}
    >
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
        <div className="mb-3">
          <BackButton />
        </div>

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
        {sorted.map((item, index) => {
          const progress = item.getProgress(ctx);
          const done = progress >= item.target;
          const rarity = RARITY_STYLE[item.rarity];
          const span2 = Boolean(item.span2);

          return (
            <motion.button
              key={item.id}
              type="button"
              onClick={() => setSelectedId(item.id)}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.42,
                delay: 0.05 + index * 0.035,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileTap={{ scale: 0.97 }}
              className={`relative flex text-center px-2.5 pt-3.5 pb-3 ${
                span2 ? 'flex-row items-center gap-3 col-span-2' : 'flex-col items-center'
              }`}
              style={{
                gridColumn: span2 ? '1 / -1' : undefined,
                minHeight: span2 ? 148 : 178,
                borderRadius: 16,
                cursor: 'pointer',
                background: done
                  ? rarity.fill
                  : 'linear-gradient(165deg, rgba(32,26,18,0.92) 0%, rgba(12,10,8,0.98) 100%)',
                border: done ? `1.5px solid ${rarity.border}` : '1px solid rgba(120,95,50,0.28)',
                boxShadow: done
                  ? `${rarity.glow}, inset 0 1px 0 rgba(255,255,255,0.12)`
                  : 'inset 0 1px 0 rgba(255,255,255,0.03)',
              }}
            >
              {pinnedIds.includes(item.id) && (
                <span
                  className="sans absolute top-2 left-2"
                  style={{ fontSize: 11, color: rarity.accent }}
                  aria-label="В профиле"
                >
                  ★
                </span>
              )}

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

              <AchievementMedallion id={item.id} locked={!done} size={span2 ? 64 : 72} />

              <div
                className={`flex flex-col ${span2 ? 'items-start text-left flex-1 min-w-0' : 'items-center w-full'}`}
              >
                <p
                  className="sans uppercase px-1.5 py-0.5"
                  style={{
                    fontSize: 9,
                    color: rarity.accent,
                    letterSpacing: '0.14em',
                    marginTop: span2 ? 0 : 10,
                    borderRadius: 999,
                    background: done ? rarity.chip : 'transparent',
                  }}
                >
                  {rarity.label}
                </p>
                <p
                  className="serif font-semibold uppercase mt-1"
                  style={{
                    fontSize: span2 ? 16 : 12,
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
                    fontSize: span2 ? 12 : 10.5,
                    lineHeight: 1.35,
                    color: done ? '#C0B49A' : '#564C3E',
                  }}
                >
                  {item.description}
                </p>

                <div className={`mt-2 w-full ${span2 ? '' : ''}`}>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span
                      className="sans num font-semibold"
                      style={{
                        fontSize: 12,
                        letterSpacing: '0.08em',
                        color: done ? '#F7D98A' : '#5C5346',
                      }}
                    >
                      XP {item.xp}
                    </span>
                    <span
                      className="sans"
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: done ? rarity.accent : '#6B614E',
                      }}
                    >
                      {done ? 'Получено' : `${progress}/${item.target}`}
                    </span>
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: 4,
                      borderRadius: 99,
                      overflow: 'hidden',
                      background: 'rgba(199,154,61,0.12)',
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(100, Math.round((progress / item.target) * 100))}%`,
                        height: '100%',
                        borderRadius: 99,
                        background: done
                          ? 'linear-gradient(90deg, #9C6A1F, #F7D98A)'
                          : 'linear-gradient(90deg, rgba(156,106,31,0.55), rgba(200,154,61,0.85))',
                        transition: 'width 0.35s ease',
                      }}
                    />
                  </div>
                </div>
              </div>
            </motion.button>
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

      {createPortal(
        <AnimatePresence>
          {selected && (
            <AchievementHowToModal
              item={selected}
              progress={selectedProgress}
              done={selectedDone}
              pinned={pinnedIds.includes(selected.id)}
              canPin={selectedDone}
              pinLimitReached={pinnedIds.length >= MAX_PINNED}
              onTogglePin={() => togglePinned(selected.id)}
              onClose={() => setSelectedId(null)}
            />
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}

function AchievementHowToModal({
  item,
  progress,
  done,
  pinned,
  canPin,
  pinLimitReached,
  onTogglePin,
  onClose,
}: {
  item: AchievementDef;
  progress: number;
  done: boolean;
  pinned: boolean;
  canPin: boolean;
  pinLimitReached: boolean;
  onTogglePin: () => void;
  onClose: () => void;
}): JSX.Element {
  const rarity = RARITY_STYLE[item.rarity];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center px-4"
      style={{
        zIndex: 1000,
        background: 'rgba(0,0,0,0.72)',
        paddingTop: 'max(16px, env(safe-area-inset-top))',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
      }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="achievement-howto-title"
        initial={{ y: 40, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 24, opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md rounded-[22px] p-5"
        style={{
          background: 'linear-gradient(180deg, #1A1610 0%, #0E0C09 100%)',
          border: `1px solid ${rarity.border}`,
          boxShadow: '0 20px 50px rgba(0,0,0,0.55)',
        }}
      >
        <div className="flex flex-col items-center text-center">
          <AchievementMedallion id={item.id} locked={!done} size={88} />
          <p
            className="sans uppercase mt-3"
            style={{ fontSize: 10, color: rarity.accent, letterSpacing: '0.14em' }}
          >
            {rarity.label}
          </p>
          <h3
            id="achievement-howto-title"
            className="serif font-semibold uppercase mt-1"
            style={{ fontSize: 18, color: '#F5EDD6', letterSpacing: '0.04em' }}
          >
            {item.title}
          </h3>
          <p className="sans mt-1" style={{ fontSize: 12, color: '#8A7A62' }}>
            {item.description}
          </p>
          <div className="mt-3 w-full">
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <span
                className="sans num font-semibold"
                style={{ fontSize: 13, color: '#F7D98A', letterSpacing: '0.06em' }}
              >
                XP {item.xp}
              </span>
              <span
                className="sans"
                style={{
                  fontSize: 11,
                  color: done ? rarity.accent : '#6B614E',
                  fontWeight: 600,
                }}
              >
                {done ? 'Получено' : `${progress}/${item.target}`}
              </span>
            </div>
            <div
              style={{
                width: '100%',
                height: 5,
                borderRadius: 99,
                overflow: 'hidden',
                background: 'rgba(199,154,61,0.12)',
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, Math.round((progress / item.target) * 100))}%`,
                  height: '100%',
                  borderRadius: 99,
                  background: done
                    ? 'linear-gradient(90deg, #9C6A1F, #F7D98A)'
                    : 'linear-gradient(90deg, rgba(156,106,31,0.55), rgba(200,154,61,0.85))',
                }}
              />
            </div>
          </div>
        </div>

        <div
          className="mt-4 rounded-[16px] px-3.5 py-3"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(199,154,61,0.16)',
          }}
        >
          <p
            className="sans uppercase"
            style={{ fontSize: 10, color: '#C89A3D', letterSpacing: '0.14em', fontWeight: 700 }}
          >
            Как открыть
          </p>
          <p className="sans mt-2" style={{ fontSize: 13, color: '#D8CEBC', lineHeight: 1.55 }}>
            {item.howTo}
          </p>
        </div>

        {canPin && (
          <>
            <button
              type="button"
              onClick={onTogglePin}
              disabled={!pinned && pinLimitReached}
              className="w-full mt-4 py-3 rounded-[14px] sans font-semibold"
              style={{
                background: pinned ? 'rgba(199,154,61,0.14)' : 'transparent',
                border: `1px solid ${rarity.border}`,
                color: rarity.accent,
                fontSize: 13,
                cursor: !pinned && pinLimitReached ? 'not-allowed' : 'pointer',
                opacity: !pinned && pinLimitReached ? 0.45 : 1,
              }}
            >
              {pinned ? '★ Убрать из профиля' : '☆ Добавить в профиль'}
            </button>
            <p className="sans text-center mt-2" style={{ fontSize: 11, color: '#6B614E' }}>
              Достижения из профиля видны другим игрокам в списке участников турнира. Максимум{' '}
              {MAX_PINNED}.
            </p>
          </>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full mt-3 py-3 rounded-[14px] sans font-semibold"
          style={{
            background: 'linear-gradient(135deg,#9C6A1F,#C89A3D)',
            border: 'none',
            color: '#0A0A0A',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Понятно
        </button>
      </motion.div>
    </motion.div>
  );
}
