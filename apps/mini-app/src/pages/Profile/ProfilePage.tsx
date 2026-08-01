import { FormEvent, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader } from '@gutshot/ui';
import type { AchievementCode } from '@gutshot/types';
import {
  useAchievements,
  usePlayerEvents,
  useProfile,
  useTournamentHistory,
  useUpdateNickname,
} from '../../entities/player';
import { MyQrModal } from '../../widgets/MyQrModal/MyQrModal';
import { GoldBadge, Logo, SectionLabel } from '../../shared/ui/figma';
import { PlayerAvatar } from '../../shared/ui/PlayerAvatar';
import { displayNameOf } from '../../shared/lib/display-name';
import { formatDate } from '../../shared/lib/format';
import { PLAYER_EVENT_LABELS, formatEventDate } from '../../shared/lib/event-labels';

const RARE_ACHIEVEMENTS: { code: AchievementCode; icon: string; title: string }[] = [
  { code: 'FOUR_OF_A_KIND', icon: '🃏', title: 'Каре' },
  { code: 'STRAIGHT_FLUSH', icon: '🔥', title: 'Стрит-флеш' },
  { code: 'ROYAL_FLUSH', icon: '👑', title: 'Роял-флеш' },
];

interface StatItem {
  icon: string;
  value: string;
  label: string;
}

interface Achievement {
  icon: string;
  title: string;
  unlocked: boolean;
  progress?: string;
}

export function ProfilePage(): JSX.Element {
  const { data: profile, isLoading } = useProfile();
  const { data: history } = useTournamentHistory();
  const { data: events } = usePlayerEvents();
  const { data: unlockedAchievements } = useAchievements();
  const updateNickname = useUpdateNickname();
  const [isQrOpen, setQrOpen] = useState(false);
  const [isEditingName, setEditingName] = useState(false);
  const [nicknameDraft, setNicknameDraft] = useState('');

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

  const achievements: Achievement[] = [
    { icon: '🏆', title: 'Первая игра', unlocked: s.tournamentsPlayed > 0 },
    { icon: '🃏', title: 'Первая пара', unlocked: s.tournamentsPlayed >= 2 },
    { icon: '🪙', title: 'Первый ITM', unlocked: s.itm > 0 },
    { icon: '👑', title: 'Первый финальный стол', unlocked: s.top10Percent > 0 },
    {
      icon: '🔒',
      title: 'Первая победа',
      unlocked: s.wins > 0,
      progress: `${Math.min(s.wins, 1)}/1`,
    },
  ];

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
          className="absolute flex items-center justify-center rounded-[14px]"
          style={{
            top: 20,
            left: 18,
            width: 42,
            height: 42,
            zIndex: 2,
            background: 'linear-gradient(145deg, rgba(199,154,61,0.16), rgba(156,106,31,0.06))',
            border: '1px solid rgba(199,154,61,0.32)',
            cursor: 'pointer',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 4h6v6H4V4Zm0 10h6v6H4v-6ZM14 4h6v6h-6V4Zm0 10h2v2h-2v-2Zm4 0h2v2h-2v-2Zm-4 4h2v2h-2v-2Zm4 0h2v2h-2v-2Z"
              stroke="#C89A3D"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        </motion.button>

        <Logo size="md" />

        <div className="relative mt-3">
          <PlayerAvatar
            photoUrl={profile.photoUrl}
            firstName={profile.firstName}
            lastName={profile.lastName}
            nickname={profile.nickname}
            size={80}
          />
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setNicknameDraft(name);
              setEditingName(true);
            }}
            className="inline-flex items-center gap-2"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <h2 className="serif font-semibold" style={{ fontSize: 22, color: '#F5EDD6', lineHeight: 1.2 }}>
              {name}
            </h2>
            <span className="sans" style={{ fontSize: 12, color: 'rgba(199,154,61,0.75)' }}>
              ✎
            </span>
          </button>
          <div className="mt-2">
            <GoldBadge>Уровень {profile.level} ›</GoldBadge>
          </div>
          {profile.username && (
            <p className="sans mt-2" style={{ fontSize: 11, color: '#6B614E' }}>
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
          <span className="sans" style={{ fontSize: 10.5, color: profile.isVerified ? '#C89A3D' : '#6B614E' }}>
            {profile.isVerified ? 'Профиль подтверждён' : 'Профиль не подтверждён'}
          </span>
        </div>

        {/* Level progress */}
        <div className="w-full mt-2">
          <div className="flex justify-between mb-1.5">
            <span className="sans num" style={{ fontSize: 9, color: '#6B614E' }}>
              {profile.xp.toLocaleString('ru-RU')} XP
            </span>
            <span className="sans num" style={{ fontSize: 9, color: '#6B614E' }}>
              {profile.nextLevelXp.toLocaleString('ru-RU')} XP
            </span>
          </div>
          <div className="rounded-full overflow-hidden" style={{ height: 4, background: 'rgba(199,154,61,0.1)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpPct}%` }}
              transition={{ duration: 1.4, ease: 'easeOut', delay: 0.2 }}
              style={{
                height: '100%',
                background: 'linear-gradient(90deg,#9C6A1F,#C89A3D,#F7D98A)',
                borderRadius: 99,
              }}
            />
          </div>
          <p className="sans num mt-1.5 text-center" style={{ fontSize: 9, color: 'rgba(199,154,61,0.5)' }}>
            {Math.max(profile.nextLevelXp - profile.xp, 0).toLocaleString('ru-RU')} XP до следующего уровня
          </p>
        </div>
      </div>

      <div className="px-5 py-5 flex flex-col gap-6">
        {/* Statistics */}
        <div>
          <div className="mb-3 flex items-baseline gap-2">
            <SectionLabel>Статистика</SectionLabel>
            <span className="sans uppercase" style={{ fontSize: 8, color: 'rgba(199,154,61,0.45)', letterSpacing: '0.18em' }}>
              · Общая
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1.5 p-4 rounded-[18px] vip-card">
                <span style={{ fontSize: 18 }}>{stat.icon}</span>
                <span className="sans font-semibold" style={{ fontSize: 14, color: '#F5EDD6', lineHeight: 1.3 }}>
                  {stat.value}
                </span>
                <span className="sans uppercase" style={{ fontSize: 9, color: '#6B614E', letterSpacing: '0.12em' }}>
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <SectionLabel>Достижения</SectionLabel>
          </div>
          <div className="flex gap-3 overflow-x-auto hs pb-1 -mx-5 px-5">
            {achievements.map((a) => (
              <div
                key={a.title}
                className="shrink-0 flex flex-col items-center gap-2 p-3 rounded-[16px] vip-card"
                style={{ width: 96, opacity: a.unlocked ? 1 : 0.45 }}
              >
                <span
                  style={{
                    fontSize: 26,
                    filter: a.unlocked ? 'drop-shadow(0 0 8px rgba(199,154,61,0.5))' : 'grayscale(1)',
                  }}
                >
                  {a.unlocked ? a.icon : '🔒'}
                </span>
                <span className="sans text-center" style={{ fontSize: 9.5, color: '#D8CEBC', lineHeight: 1.25 }}>
                  {a.title}
                </span>
                <span
                  className="sans"
                  style={{ fontSize: 8.5, color: a.unlocked ? '#C89A3D' : '#6B614E', letterSpacing: '0.06em' }}
                >
                  {a.unlocked ? 'Получено' : a.progress ?? 'Закрыто'}
                </span>
              </div>
            ))}
          </div>

          {/* Редкие комбинации — отмечаются администратором по QR-коду */}
          <div className="mt-3 grid grid-cols-3 gap-3">
            {RARE_ACHIEVEMENTS.map((achievement) => {
              const unlocked = unlockedCodes.has(achievement.code);

              return (
                <div
                  key={achievement.code}
                  className="flex flex-col items-center gap-2 p-3 rounded-[16px] vip-card"
                  style={{ opacity: unlocked ? 1 : 0.45 }}
                >
                  <span
                    style={{
                      fontSize: 24,
                      filter: unlocked
                        ? 'drop-shadow(0 0 8px rgba(199,154,61,0.5))'
                        : 'grayscale(1)',
                    }}
                  >
                    {unlocked ? achievement.icon : '🔒'}
                  </span>
                  <span
                    className="sans text-center"
                    style={{ fontSize: 9.5, color: '#D8CEBC', lineHeight: 1.25 }}
                  >
                    {achievement.title}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Rare milestone */}
          <div
            className="mt-3 rounded-[18px] p-4 relative overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, #14110b 0%, #0d0b07 100%)',
              border: '1px solid rgba(120,110,90,0.25)',
            }}
          >
            <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.35)' }} />
            <div className="relative flex items-start gap-3">
              <span style={{ fontSize: 26, filter: 'grayscale(0.6)', opacity: 0.7 }}>👑</span>
              <div className="min-w-0">
                <p className="serif font-semibold" style={{ fontSize: 14, color: '#C0B49A', lineHeight: 1.3 }}>
                  💎 Самое редкое достижение клуба: Легенда Gutshot
                </p>
                <p className="sans mt-1.5" style={{ fontSize: 10, color: '#6B614E', lineHeight: 1.5 }}>
                  Выдаётся при одновременном выполнении: 100 побед, 100 уровень, хотя бы один
                  роял-флеш, 100 нокаутов, 1 победа в финале месяца.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Активность: все события клуба по игроку */}
        {events && events.length > 0 && (
          <div>
            <div className="mb-3">
              <SectionLabel>Активность</SectionLabel>
            </div>
            {events.map((event, i) => (
              <div
                key={event.id}
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
                  <span className="sans num shrink-0" style={{ fontSize: 11.5, color: '#C89A3D' }}>
                    {event.xpAmount > 0 ? '+' : ''}
                    {event.xpAmount} XP
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* History */}
        {history && history.length > 0 && (
          <div>
            <div className="mb-3">
              <SectionLabel>История</SectionLabel>
            </div>
            {history.map((registration, i) => (
              <div
                key={registration.id}
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
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col items-center gap-2 py-4">
          <Logo size="sm" />
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
