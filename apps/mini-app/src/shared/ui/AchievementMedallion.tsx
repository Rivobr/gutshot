/** Золотые значки достижений — ассеты в стиле постера «Система достижений». */

const ICON_SRC: Record<string, string> = {
  first_visit: '/achievements/first_visit.png',
  visit_5: '/achievements/visit_5.png',
  four_kind: '/achievements/four_kind.png',
  first_knockout: '/achievements/first_knockout.png',
  royal_flush: '/achievements/royal_flush.png',
  visit_10: '/achievements/visit_10.png',
  first_win: '/achievements/first_win.png',
  straight_flush: '/achievements/straight_flush.png',
  final_table: '/achievements/final_table.png',
  win_streak: '/achievements/win_streak.png',
};

export function AchievementMedallion({
  id,
  locked = false,
  size = 56,
}: {
  id: string;
  locked?: boolean;
  size?: number;
}): JSX.Element {
  const src = ICON_SRC[id] ?? ICON_SRC.win_streak;

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
