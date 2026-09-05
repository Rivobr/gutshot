import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader } from '@gutshot/ui';
import {
  useAchievementTexts,
  useAchievementsCatalog,
  useProfile,
  usePublicProfile,
} from '../../entities/player';
import { SectionLabel } from '../../shared/ui/figma';
import { PlayerAvatar } from '../../shared/ui/PlayerAvatar';
import { displayNameOf } from '../../shared/lib/display-name';
import { styleForAchievement, buildAchievementViews } from '../../shared/lib/achievements-catalog';
import { AchievementMedallion } from '../../shared/ui/AchievementMedallion';

function LevelBadge({ level, current = false }: { level: number; current?: boolean }): JSX.Element {
  return (
    <div
      className="flex shrink-0 flex-col items-center justify-center"
      style={{
        width: current ? 52 : 44,
        height: current ? 52 : 44,
        borderRadius: 14,
        background: current
          ? 'linear-gradient(145deg, rgba(199,154,61,0.28), rgba(20,16,10,0.95))'
          : 'rgba(9,9,9,0.5)',
        border: `1px solid ${current ? 'rgba(247,217,138,0.5)' : 'rgba(199,154,61,0.18)'}`,
        boxShadow: current ? '0 0 18px rgba(199,154,61,0.25)' : 'none',
      }}
    >
      <span
        className="sans uppercase"
        style={{ fontSize: 7, letterSpacing: '0.14em', color: '#8A7A62' }}
      >
        Ур.
      </span>
      <span
        className="serif num font-semibold"
        style={{
          fontSize: current ? 22 : 18,
          lineHeight: 1,
          color: current ? '#F7D98A' : '#A89878',
        }}
      >
        {level}
      </span>
    </div>
  );
}

export function PlayerProfilePage(): JSX.Element {
  const navigate = useNavigate();
  const { userId = '' } = useParams<{ userId: string }>();
  const { data: me } = useProfile();
  const { data: profile, isLoading, isError } = usePublicProfile(userId);
  const { data: achievementsCatalog } = useAchievementsCatalog();
  const { data: achievementTexts } = useAchievementTexts();

  const pinnedViews = useMemo(() => {
    if (!profile) {
      return [];
    }
    const views = buildAchievementViews(achievementsCatalog, achievementTexts, {}, []);
    const byId = new Map(views.map((item) => [item.id, item]));
    return (profile.pinnedAchievements ?? [])
      .map((id) => byId.get(id))
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  }, [achievementsCatalog, achievementTexts, profile]);

  useEffect(() => {
    if (me?.id && userId && me.id === userId) {
      navigate('/profile', { replace: true });
    }
  }, [me?.id, navigate, userId]);

  if ((me?.id && userId && me.id === userId) || isLoading) {
    return <Loader />;
  }

  if (isError || !profile) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-5 py-20">
        <span style={{ fontSize: 32, opacity: 0.25 }}>♠</span>
        <p className="serif" style={{ fontSize: 16, color: '#6B614E' }}>
          Профиль не найден
        </p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="sans rounded-full px-4 py-2"
          style={{
            border: '1px solid rgba(199,154,61,0.35)',
            background: 'rgba(199,154,61,0.12)',
            color: '#C89A3D',
            fontSize: 12,
          }}
        >
          Назад
        </button>
      </div>
    );
  }

  const name = displayNameOf(profile);
  const xpPct = Math.round(profile.progress * 100);
  const s = profile.stats;
  const stats = [
    { icon: '🎖', value: `${s.top10Percent}%`, label: 'ТОП-10' },
    {
      icon: '📈',
      value: s.averagePlace !== null ? `${s.averagePlace}` : '—',
      label: 'Среднее место',
    },
    { icon: '📅', value: `${s.daysInClub}`, label: 'Дней в клубе' },
    { icon: '🏆', value: `${s.wins}`, label: 'Побед' },
    { icon: '🃏', value: `${s.tournamentsPlayed}`, label: 'Турниров сыграно' },
  ];

  return (
    <div className="flex flex-col">
      <div
        className="relative px-5 pt-8 pb-8 flex flex-col items-center gap-3"
        style={{
          background: 'linear-gradient(180deg, #181309 0%, #090909 100%)',
          borderBottom: '1px solid rgba(199,154,61,0.12)',
        }}
      >
        <div className="absolute inset-0 deco-lines opacity-45 pointer-events-none" />

        <motion.button
          type="button"
          onClick={() => navigate(-1)}
          whileTap={{ scale: 0.92 }}
          aria-label="Назад"
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
            color: '#C89A3D',
            fontSize: 22,
          }}
        >
          ←
        </motion.button>

        <div className="relative mt-3">
          <PlayerAvatar
            photoUrl={profile.photoUrl}
            firstName={profile.firstName}
            lastName={profile.lastName}
            nickname={profile.nickname}
            size={80}
            legend={Boolean(profile.isLegendGutshot)}
          />
        </div>

        <div className="text-center w-full">
          <h2
            className="serif font-semibold"
            style={{ fontSize: 24, color: '#F5EDD6', lineHeight: 1.2 }}
          >
            {name}
          </h2>
          {profile.isLegendGutshot && (
            <p
              className="sans uppercase mt-1"
              style={{ fontSize: 10, letterSpacing: '0.16em', color: '#C89A3D' }}
            >
              Легенда Gutshot
            </p>
          )}
          {profile.username && (
            <p className="sans mt-1" style={{ fontSize: 12, color: '#6B614E' }}>
              @{profile.username}
            </p>
          )}
          {profile.isVerified && (
            <p className="sans mt-1" style={{ fontSize: 11, color: 'rgba(199,154,61,0.75)' }}>
              ✓ Верифицирован
            </p>
          )}
        </div>

        <div className="w-full mt-2 px-1">
          <div className="flex items-center gap-3">
            <LevelBadge level={profile.level} current />
            <div className="flex-1 min-w-0">
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ background: 'rgba(199,154,61,0.12)' }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${xpPct}%`,
                    background: 'linear-gradient(90deg, #9C6A1F, #C89A3D)',
                  }}
                />
              </div>
              <p className="sans num mt-1.5 text-center" style={{ fontSize: 11, color: '#8A7A62' }}>
                {profile.xp.toLocaleString('ru-RU')} XP · {xpPct}%
              </p>
            </div>
            <LevelBadge level={profile.level + 1} />
          </div>
        </div>
      </div>

      <div className="px-5 pt-5 pb-3">
        <SectionLabel>Статистика</SectionLabel>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {stats.map((item) => (
            <div
              key={item.label}
              className="rounded-[16px] p-3"
              style={{
                background: 'rgba(20,18,16,0.85)',
                border: '1px solid rgba(199,154,61,0.12)',
              }}
            >
              <p className="sans" style={{ fontSize: 16 }}>
                {item.icon}{' '}
                <span className="num font-semibold" style={{ color: '#F5EDD6' }}>
                  {item.value}
                </span>
              </p>
              <p className="sans mt-1" style={{ fontSize: 11, color: '#6B614E' }}>
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 pt-2 pb-8">
        <SectionLabel>Витрина достижений</SectionLabel>
        {pinnedViews.length === 0 ? (
          <p className="sans mt-3" style={{ fontSize: 13, color: '#6B614E' }}>
            Игрок пока не закрепил достижения
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {pinnedViews.map((item) => {
              const rarity = styleForAchievement(item.id, item.rarity);
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-[16px] p-3"
                  style={{
                    background: rarity.fill,
                    border: `1px solid ${rarity.border}`,
                    boxShadow: rarity.glow,
                  }}
                >
                  <AchievementMedallion
                    group={item.group}
                    rarity={item.rarity}
                    size={48}
                    title={item.title}
                    achievementId={item.id}
                  />
                  <div className="min-w-0">
                    <p className="serif truncate" style={{ fontSize: 14, color: '#F5EDD6' }}>
                      {item.title}
                    </p>
                    <p
                      className="sans uppercase truncate"
                      style={{ fontSize: 10, color: rarity.accent, letterSpacing: '0.12em' }}
                    >
                      {rarity.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
