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

/** Ряд витринных ачивок со свечением редкости. */
export function PlayerShowcaseMedals({
  items,
  size = 22,
}: {
  items?: ShowcaseAchievement[] | null;
  size?: number;
}): JSX.Element | null {
  if (!items?.length) return null;

  return (
    <div className="flex shrink-0 items-center gap-1">
      {items.slice(0, 3).map((item) => (
        <AchievementMedallion
          key={item.id}
          group={item.group}
          rarity={item.rarity}
          title={item.title}
          size={size}
        />
      ))}
    </div>
  );
}
