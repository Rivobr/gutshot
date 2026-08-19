import type { ShowcaseAchievement } from '@gutshot/types';
import { AchievementMedallion } from './AchievementMedallion';

/** Компактный бейдж уровня рядом с именем игрока. */
export function PlayerLevelBadge({
  level,
  size = 'sm',
}: {
  level?: number | null;
  size?: 'sm' | 'xs';
}): JSX.Element | null {
  if (level == null || level < 1) return null;
  const fontSize = size === 'xs' ? 9 : 10;
  const pad = size === 'xs' ? '1px 5px' : '2px 7px';

  return (
    <span
      className="sans num shrink-0"
      style={{
        fontSize,
        fontWeight: 600,
        letterSpacing: '0.04em',
        color: '#F7D98A',
        background: 'rgba(199,154,61,0.16)',
        border: '1px solid rgba(199,154,61,0.35)',
        borderRadius: 999,
        padding: pad,
        lineHeight: 1.3,
      }}
    >
      Ур. {level}
    </span>
  );
}

const RARITY_ORDER: Record<string, number> = {
  common: 1,
  rare: 2,
  epic: 3,
  legend: 4,
};

/** Одно витринное достижение — самое редкое из выбранных игроком. */
export function PlayerShowcaseMedals({
  items,
  size = 32,
}: {
  items?: ShowcaseAchievement[] | null;
  size?: number;
}): JSX.Element | null {
  if (!items?.length) return null;

  const rarest = [...items].sort(
    (a, b) => (RARITY_ORDER[b.rarity] ?? 0) - (RARITY_ORDER[a.rarity] ?? 0),
  )[0];

  return (
    <div className="flex shrink-0 items-center">
      <AchievementMedallion
        key={rarest.id}
        group={rarest.group}
        rarity={rarest.rarity}
        title={rarest.title}
        achievementId={rarest.id}
        size={size}
      />
    </div>
  );
}
