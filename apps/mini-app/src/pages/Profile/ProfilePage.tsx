import { FormEvent, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Loader } from '@gutshot/ui';
import {
  useAchievementTexts,
  useAchievements,
  usePlayerEvents,
  useProfile,
  useTournamentHistory,
  useUpdateNickname,
} from '../../entities/player';
import { MyQrModal } from '../../widgets/MyQrModal/MyQrModal';
import { SectionLabel } from '../../shared/ui/figma';
import { PlayerAvatar } from '../../shared/ui/PlayerAvatar';
import { displayNameOf } from '../../shared/lib/display-name';
import { formatDate } from '../../shared/lib/format';
import { PLAYER_EVENT_LABELS, formatEventDate } from '../../shared/lib/event-labels';
import {
  mergeAchievementTexts,
  type AchievementContext,
} from '../../shared/lib/achievements-catalog';
import { AchievementMedallion } from '../../shared/ui/AchievementMedallion';

interface StatItem {
  icon: string;
  value: string;
  label: string;
}

export function ProfilePage(): JSX.Element {
  const navigate = useNavigate();
  const { data: profile, isLoading } = useProfile();
  const { data: history } = useTournamentHistory();
  const { data: events } = usePlayerEvents();
  const { data: unlockedAchievements } = useAchievements();
  const { data: achievementTexts } = useAchievementTexts();
  const updateNickname = useUpdateNickname();
  const [isQrOpen, setQrOpen] = useState(false);
  const [isEditingName, setEditingName] = useState(false);
  const [isActivityOpen, setActivityOpen] = useState(false);
  const [nicknameDraft, setNicknameDraft] = useState('');
  const catalog = useMemo(
    () => mergeAchievementTexts(achievementTexts),
    [achievementTexts],
  );

  useEffect(() => {
    if (profile) {
      setNicknameDraft(displayNameOf(profile));
    }
  }, [profile]);

  if (isLoading || !profile) {
    return <Loader />;
  }

  const unlockedCodes = new Set((unlockedAchievements ?? []).map((item) => item.code));

  const xpPct = Math.round(profile.progress * 100);
  const s = profile.stats;
  const name = displayNameOf(profile);

  const handleSaveNickname = (event: FormEvent) => {
    event.preventDefault();
    updateNickname.mutate(nicknameDraft, {
      onSuccess: () => setEditingName(false),
    });
  };

  const stats: StatItem[] = [
    { icon: '🏆', value: `${s.wins}`, label: 'Побед' },
    { icon: '🃏', value: `${s.tournamentsPlayed}`, label: 'Турниров сыграно' },
    { icon: '🎖', value: `${s.itm} ITM / ${s.top10Percent}% ТОП-10`, label: 'В призах' },
    { icon: '👑', value: `${s.firstPlaces}`, label: 'Первых мест' },
    { icon: '📈', value: s.averagePlace !== null ? `${s.averagePlace}` : '—', label: 'Среднее место' },
    { icon: '📅', value: `${s.daysInClub}`, label: 'Дней в клубе' },
  ];

  const achievementCtx: AchievementContext = {
    visits: s.visits ?? 0,
    wins: s.wins,
    finalTables: s.finalTables ?? 0,
    winStreak: s.winStreak ?? 0,
    bounties: s.bounties ?? 0,
    unlockedCodes,
  };

  const previewAchievements = catalog.slice(0, 5).map((item) => {
    const progress = item.getProgress(achievementCtx);
    const unlocked = progress >= item.target;
    return {
      id: item.id,
      icon: item.icon,
      title: item.title,
      unlocked,
      progress: unlocked ? 'Получено' : `${progress}/${item.target}`,
    };
  });

  return (
    <div className="flex flex-col">
      {/* Identity header */}
      <div
        className="relative px-5 pt-8 pb-8 flex flex-col items-center gap-3"
        style={{
          background: 'linear-gradient(180deg, #181309 0%, #090909 100%)',
          borderBottom: '1px solid rgba(199,154,61,0.12)',
        }}
      >
        <div className="absolute inset-0 deco-lines opacity-45 pointer-events-none" />

        {/* Постоянный QR-код игрока */}
        <motion.button
          type="button"
          onClick={() => setQrOpen(true)}
          whileTap={{ scale: 0.92 }}
          aria-label="Мой QR-код"
          className="absolute flex items-center justify-center rounded-[16px]"
          style={{
            top: 24,
            left: 16,
            width: 52,
            height: 52,
            zIndex: 2,
            background: 'linear-gradient(145deg, rgba(199,154,61,0.16), rgba(156,106,31,0.06))',
            border: '1px solid rgba(199,154,61,0.32)',
            cursor: 'pointer',
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 4h6v6H4V4Zm0 10h6v6H4v-6ZM14 4h6v6h-6V4Zm0 10h2v2h-2v-2Zm4 0h2v2h-2v-2Zm-4 4h2v2h-2v-2Zm4 0h2v2h-2v-2Z"
              stroke="#C89A3D"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        </motion.button>

        <motion.button
          type="button"
          onClick={() => {
            setNicknameDraft(name);
            setEditingName(true);
          }}
          whileTap={{ scale: 0.92 }}
          aria-label="Изменить никнейм"
          className="absolute flex items-center justify-center rounded-[16px]"
          style={{
            top: 24,
            right: 16,
            width: 52,
            height: 52,
            zIndex: 2,
            background: 'linear-gradient(145deg, rgba(199,154,61,0.16), rgba(156,106,31,0.06))',
            border: '1px solid rgba(199,154,61,0.32)',
            cursor: 'pointer',
            color: '#C89A3D',
            fontSize: 22,
          }}
        >
          ✎
        </motion.button>

        <div className="relative mt-3">
          <PlayerAvatar
            photoUrl={profile.photoUrl}
            firstName={profile.firstName}
            lastName={profile.lastName}
            nickname={profile.nickname}
            size={80}
          />
        </div>

        <div className="text-center w-full">
          <h2 className="serif font-semibold" style={{ fontSize: 24, color: '#F5EDD6', lineHeight: 1.2 }}>
            {name}
          </h2>
          {profile.username && (
            <p className="sans mt-2" style={{ fontSize: 13, color: '#6B614E' }}>
              @{profile.username}
            </p>
          )}
        </div>

        {/* KYC verification */}
        <div
          className="relative flex items-center gap-2 px-3.5 py-2 rounded-full mt-1"
          style={{
            background: profile.isVerified ? 'rgba(199,154,61,0.1)' : 'rgba(120,110,90,0.08)',
            border: `1px solid ${profile.isVerified ? 'rgba(199,154,61,0.35)' : 'rgba(120,110,90,0.25)'}`,
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L20 5V11C20 16 16.5 20 12 22C7.5 20 4 16 4 11V5L12 2Z"
              fill={profile.isVerified ? 'url(#shieldG)' : 'none'}
              stroke={profile.isVerified ? 'none' : '#6B614E'}
              strokeWidth="1.5"
            />
            {profile.isVerified && (
              <path d="M8.5 12L11 14.5L15.5 9.5" stroke="#0A0A0A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            )}
            <defs>
              <linearGradient id="shieldG" x1="4" y1="2" x2="20" y2="22">
                <stop stopColor="#C89A3D" />
                <stop offset="1" stopColor="#9C6A1F" />
              </linearGradient>
            </defs>
          </svg>
          <span className="sans" style={{ fontSize: 13, color: profile.isVerified ? '#C89A3D' : '#6B614E' }}>
            {profile.isVerified ? 'Профиль подтверждён' : 'Профиль не подтверждён'}
          </span>
        </div>

        {/* Уровень + XP — крупно и читаемо */}
        <div
          className="w-full mt-3 rounded-[20px] p-4 relative overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, rgba(199,154,61,0.14), rgba(14,12,9,0.95))',
            border: '1px solid rgba(199,154,61,0.28)',
          }}
        >
          <div className="absolute inset-0 deco-lines opacity-30 pointer-events-none" />
          <div className="relative flex items-center justify-between gap-3 mb-3">
            <div>
              <p
                className="sans uppercase"
                style={{ fontSize: 11, color: '#8A7A62', letterSpacing: '0.16em' }}
              >
                Уровень
              </p>
              <p className="serif font-semibold gold-text" style={{ fontSize: 36, lineHeight: 1.05 }}>
                {profile.level}
              </p>
            </div>
            <div className="text-right">
              <p className="sans" style={{ fontSize: 12, color: '#8A7A62' }}>
                Прогресс
              </p>
              <p className="sans num font-semibold" style={{ fontSize: 18, color: '#F5EDD6' }}>
                {xpPct}%
              </p>
            </div>
          </div>
          <div className="relative flex justify-between mb-2">
            <span className="sans num" style={{ fontSize: 13, color: '#C89A3D', fontWeight: 600 }}>
              {profile.xp.toLocaleString('ru-RU')} XP
            </span>
            <span className="sans num" style={{ fontSize: 13, color: '#A89878' }}>
              {profile.nextLevelXp.toLocaleString('ru-RU')} XP
            </span>
          </div>
          <div
            className="relative rounded-full overflow-hidden"
            style={{ height: 10, background: 'rgba(199,154,61,0.12)' }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpPct}%` }}
              transition={{ duration: 1.4, ease: 'easeOut', delay: 0.2 }}
              style={{
                height: '100%',
                background: 'linear-gradient(90deg,#9C6A1F,#C89A3D,#F7D98A)',
                borderRadius: 99,
                boxShadow: '0 0 12px rgba(199,154,61,0.35)',
              }}
            />
          </div>
          <p className="relative sans num mt-2.5 text-center" style={{ fontSize: 13, color: '#C0B49A' }}>
            Ещё {Math.max(profile.nextLevelXp - profile.xp, 0).toLocaleString('ru-RU')} XP до уровня{' '}
            {profile.level + 1}
          </p>
        </div>
      </div>

      <div className="px-5 py-5 flex flex-col gap-4">
        {/* Статистика */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
          className="vip-card relative overflow-hidden rounded-[22px] p-4"
        >
          <div className="absolute inset-0 deco-lines opacity-35 pointer-events-none" />
          <div className="relative mb-3.5 flex items-baseline gap-2">
            <SectionLabel>Статистика</SectionLabel>
            <span
              className="sans uppercase"
              style={{ fontSize: 8, color: 'rgba(199,154,61,0.45)', letterSpacing: '0.18em' }}
            >
              · Общая
            </span>
          </div>
          <div className="relative grid grid-cols-2 gap-2.5">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 0.4,
                  ease: [0.22, 1, 0.36, 1],
                  delay: 0.1 + index * 0.05,
                }}
                className="flex flex-col gap-1.5 rounded-[16px] p-3.5"
                style={{
                  background: 'rgba(9,9,9,0.45)',
                  border: '1px solid rgba(199,154,61,0.14)',
                }}
              >
                <span style={{ fontSize: 18 }}>{stat.icon}</span>
                <span
                  className="sans font-semibold"
                  style={{ fontSize: 14, color: '#F5EDD6', lineHeight: 1.3 }}
                >
                  {stat.value}
                </span>
                <span
                  className="sans uppercase"
                  style={{ fontSize: 9, color: '#6B614E', letterSpacing: '0.12em' }}
                >
                  {stat.label}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Достижения */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
          className="vip-card relative overflow-hidden rounded-[22px] p-4"
        >
          <div className="absolute inset-0 deco-lines opacity-35 pointer-events-none" />
          <button
            type="button"
            onClick={() => navigate('/achievements')}
            className="relative mb-3.5 w-full flex items-center justify-between"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <SectionLabel>Достижения</SectionLabel>
            <span className="sans" style={{ fontSize: 12, color: '#C89A3D' }}>
              Все →
            </span>
          </button>
          <div className="relative flex gap-2.5 overflow-x-auto hs pb-0.5 -mx-1 px-1">
            {previewAchievements.map((a, index) => (
              <motion.button
                key={a.id}
                type="button"
                onClick={() => navigate('/achievements')}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: a.unlocked ? 1 : 0.5, x: 0 }}
                transition={{
                  duration: 0.4,
                  ease: [0.22, 1, 0.36, 1],
                  delay: 0.18 + index * 0.06,
                }}
                whileTap={{ scale: 0.96 }}
                className="shrink-0 flex flex-col items-center gap-2 p-3 rounded-[16px]"
                style={{
                  width: 100,
                  cursor: 'pointer',
                  background: 'rgba(9,9,9,0.45)',
                  border: a.unlocked
                    ? '1px solid rgba(199,154,61,0.32)'
                    : '1px solid rgba(199,154,61,0.12)',
                }}
              >
                <AchievementMedallion id={a.id} locked={!a.unlocked} size={42} />
                <span
                  className="sans text-center"
                  style={{ fontSize: 10, color: '#D8CEBC', lineHeight: 1.25 }}
                >
                  {a.title}
                </span>
                <span
                  className="sans"
                  style={{
                    fontSize: 9,
                    color: a.unlocked ? '#C89A3D' : '#6B614E',
                    letterSpacing: '0.06em',
                  }}
                >
                  {a.progress}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* Активность */}
        {events && events.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="vip-card relative overflow-hidden rounded-[22px] p-4"
          >
            <div className="absolute inset-0 deco-lines opacity-35 pointer-events-none" />
            <button
              type="button"
              onClick={() => setActivityOpen((open) => !open)}
              className="relative w-full flex items-center justify-between"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <SectionLabel>Активность</SectionLabel>
              <motion.span
                className="sans"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  fontSize: 12,
                  color: '#C89A3D',
                  letterSpacing: '0.04em',
                }}
              >
                {isActivityOpen ? 'Свернуть ▲' : `Показать (${events.length}) ▼`}
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isActivityOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                  className="relative"
                  style={{ overflow: 'hidden' }}
                >
                  <div className="mt-3 flex flex-col">
                    {events.map((event, i) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.03 }}
                        className={`flex items-center justify-between gap-3 py-3 ${i > 0 ? 'border-t' : ''}`}
                        style={{ borderColor: 'rgba(199,154,61,0.1)' }}
                      >
                        <div className="min-w-0">
                          <p
                            className="serif truncate"
                            style={{ fontSize: 13.5, color: '#F5EDD6', lineHeight: 1.35 }}
                          >
                            {PLAYER_EVENT_LABELS[event.type]}
                          </p>
                          <p className="sans num truncate" style={{ fontSize: 10, color: '#6B614E' }}>
                            {formatEventDate(event.createdAt)}
                            {event.tournament ? ` · ${event.tournament.title}` : ''}
                          </p>
                        </div>
                        {event.xpAmount !== 0 && (
                          <span
                            className="sans num shrink-0"
                            style={{ fontSize: 11.5, color: '#C89A3D' }}
                          >
                            {event.xpAmount > 0 ? '+' : ''}
                            {event.xpAmount} XP
                          </span>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        )}

        {/* История */}
        {history && history.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.28 }}
            className="vip-card relative overflow-hidden rounded-[22px] p-4"
          >
            <div className="absolute inset-0 deco-lines opacity-35 pointer-events-none" />
            <div className="relative mb-2">
              <SectionLabel>История</SectionLabel>
            </div>
            <div className="relative">
              {history.map((registration, i) => (
                <motion.div
                  key={registration.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.32 + i * 0.04 }}
                  className={`flex items-center justify-between py-3 ${i > 0 ? 'border-t' : ''}`}
                  style={{ borderColor: 'rgba(199,154,61,0.1)' }}
                >
                  <div>
                    <p className="serif" style={{ fontSize: 14, color: '#F5EDD6', lineHeight: 1.35 }}>
                      {registration.tournament?.title ?? 'Турнир'}
                    </p>
                    {registration.tournament && (
                      <p className="sans num" style={{ fontSize: 10, color: '#6B614E' }}>
                        {formatDate(registration.tournament.date)}
                      </p>
                    )}
                  </div>
                  <span className="sans" style={{ fontSize: 11, color: '#C89A3D' }}>
                    {registration.status === 'FINISHED' ? 'Завершён' : 'Участие'}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        <div className="flex flex-col items-center gap-2 py-4">
          <p className="sans text-center" style={{ fontSize: 10, color: '#3E3428' }}>
            Версия 1.0 · GUTSHOT Poker Club
          </p>
        </div>
      </div>

      <MyQrModal open={isQrOpen} onClose={() => setQrOpen(false)} />

      {createPortal(
        <AnimatePresence>
          {isEditingName && (
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
              onClick={() => setEditingName(false)}
            >
              <motion.form
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 24, opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                onClick={(event) => event.stopPropagation()}
                onSubmit={handleSaveNickname}
                className="w-full max-w-md rounded-[22px] p-5"
                style={{
                  background: 'linear-gradient(180deg, #1A1610 0%, #0E0C09 100%)',
                  border: '1px solid rgba(199,154,61,0.28)',
                }}
              >
                <h3 className="serif font-semibold" style={{ fontSize: 20, color: '#F5EDD6' }}>
                  Никнейм
                </h3>
                <p className="sans mt-1 mb-4" style={{ fontSize: 12, color: '#6B614E', lineHeight: 1.5 }}>
                  Так вас будут видеть другие игроки в клубе
                </p>
                <input
                  value={nicknameDraft}
                  onChange={(event) => setNicknameDraft(event.target.value)}
                  maxLength={32}
                  autoFocus
                  className="w-full rounded-[14px] px-4 py-3 sans"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(199,154,61,0.28)',
                    color: '#F5EDD6',
                    fontSize: 15,
                    outline: 'none',
                  }}
                />
                {updateNickname.isError && (
                  <p className="sans mt-2" style={{ fontSize: 12, color: '#E07A6E' }}>
                    Не удалось сохранить никнейм. Проверьте длину (2–32) и символы.
                  </p>
                )}
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingName(false)}
                    className="flex-1 py-3 rounded-[14px] sans"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(120,110,90,0.3)',
                      color: '#C0B49A',
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={updateNickname.isPending || nicknameDraft.trim().length < 2}
                    className="flex-1 py-3 rounded-[14px] sans font-semibold disabled:opacity-50"
                    style={{
                      background: 'linear-gradient(135deg,#9C6A1F,#C89A3D)',
                      border: 'none',
                      color: '#0A0A0A',
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    Сохранить
                  </button>
                </div>
              </motion.form>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}
