/** Золотые значки достижений — ассеты в стиле постера «Система достижений». */

import type { AchievementGroup } from '@gutshot/types';

/** Значок подбирается по группе достижения — так работает весь каталог клуба. */
const ICON_BY_GROUP: Record<AchievementGroup, string> = {
  wins: '/achievements/first_win.png',
  final_tables: '/achievements/final_table.png',
  tournaments: '/achievements/first_visit.png',
  active_weeks: '/achievements/visit_10.png',
  weekly_rating: '/achievements/win_streak.png',
  monthly_final: '/achievements/visit_5.png',
  four_of_a_kind: '/achievements/four_kind.png',
  straight_flush: '/achievements/straight_flush.png',
  royal_flush: '/achievements/royal_flush.png',
  special: '/achievements/win_streak.png',
  knockouts: '/achievements/first_knockout.png',
  legend: '/achievements/royal_flush.png',
};

const FALLBACK_ICON = '/achievements/first_visit.png';

export function AchievementMedallion({
  group,
  locked = false,
  size = 56,
}: {
  group?: AchievementGroup;
  locked?: boolean;
  size?: number;
}): JSX.Element {
  const src = (group && ICON_BY_GROUP[group]) || FALLBACK_ICON;

  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-flex',
        width: size,
        height: size,
        flexShrink: 0,
      }}
    >
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        draggable={false}
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          display: 'block',
          filter: locked
            ? 'grayscale(0.7) brightness(0.45) contrast(0.95)'
            : 'drop-shadow(0 2px 10px rgba(199,154,61,0.4))',
          transition: 'filter 0.25s ease',
          userSelect: 'none',
        }}
      />
    </span>
  );
}
