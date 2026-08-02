import { useId, type ReactNode } from 'react';

/** Золотые медальоны в стиле постера «Система достижений». */

const GOLD = {
  light: '#F7D98A',
  mid: '#C89A3D',
  dark: '#7D5417',
  deep: '#4A2E0A',
  rim: '#E8C56A',
};

function MedallionShell({
  children,
  locked,
  size,
}: {
  children: ReactNode;
  locked?: boolean;
  size: number;
}): JSX.Element {
  const uid = useId().replace(/:/g, '');
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden
      style={{
        display: 'block',
        filter: locked
          ? 'grayscale(0.85) brightness(0.55)'
          : 'drop-shadow(0 2px 8px rgba(199,154,61,0.35))',
      }}
    >
      <defs>
        <radialGradient id={`${uid}-face`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor={GOLD.light} />
          <stop offset="45%" stopColor={GOLD.mid} />
          <stop offset="100%" stopColor={GOLD.dark} />
        </radialGradient>
        <linearGradient id={`${uid}-rim`} x1="0" y1="0" x2="64" y2="64">
          <stop offset="0%" stopColor={GOLD.light} />
          <stop offset="50%" stopColor={GOLD.dark} />
          <stop offset="100%" stopColor={GOLD.rim} />
        </linearGradient>
        <linearGradient id={`${uid}-ink`} x1="20" y1="10" x2="48" y2="54">
          <stop offset="0%" stopColor={GOLD.deep} />
          <stop offset="100%" stopColor="#1A1006" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="31" fill={`url(#${uid}-rim)`} />
      <circle cx="32" cy="32" r="27.5" fill={`url(#${uid}-face)`} />
      <circle
        cx="32"
        cy="32"
        r="25"
        stroke={GOLD.deep}
        strokeOpacity="0.35"
        strokeWidth="1.2"
        fill="none"
      />
      <g fill={`url(#${uid}-ink)`} stroke={`url(#${uid}-ink)`} strokeWidth="0.4">
        {children}
      </g>
    </svg>
  );
}

function DoorGlyph(): JSX.Element {
  return (
    <>
      <rect x="20" y="16" width="24" height="32" rx="2" fill="none" strokeWidth="2.2" />
      <path d="M22 16V48M42 16V48" strokeWidth="1.4" fill="none" />
      <circle cx="38" cy="32" r="1.6" />
      <path d="M26 22h6M26 28h8" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </>
  );
}

function ChipGlyph({ label }: { label: string }): JSX.Element {
  return (
    <>
      <circle cx="32" cy="32" r="14" fill="none" strokeWidth="2.4" />
      <circle cx="32" cy="32" r="9" fill="none" strokeWidth="1.4" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const a = (deg * Math.PI) / 180;
        const x1 = 32 + Math.cos(a) * 11.5;
        const y1 = 32 + Math.sin(a) * 11.5;
        const x2 = 32 + Math.cos(a) * 14;
        const y2 = 32 + Math.sin(a) * 14;
        return (
          <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="2" strokeLinecap="round" />
        );
      })}
      <text
        x="32"
        y="37"
        textAnchor="middle"
        fill="#1A1006"
        stroke="none"
        fontSize="12"
        fontWeight="700"
        fontFamily="Georgia, serif"
      >
        {label}
      </text>
    </>
  );
}

function CardsGlyph({ count }: { count: 4 | 5 }): JSX.Element {
  const cards =
    count === 4
      ? [
          { x: 16, y: 20, r: -18 },
          { x: 22, y: 18, r: -6 },
          { x: 28, y: 17, r: 6 },
          { x: 34, y: 19, r: 18 },
        ]
      : [
          { x: 14, y: 21, r: -22 },
          { x: 20, y: 18, r: -10 },
          { x: 26, y: 16, r: 0 },
          { x: 32, y: 18, r: 10 },
          { x: 38, y: 21, r: 22 },
        ];
  return (
    <>
      {cards.map((c, i) => (
        <g key={i} transform={`translate(${c.x} ${c.y}) rotate(${c.r} 6 9)`}>
          <rect x="0" y="0" width="12" height="18" rx="1.5" fill="none" strokeWidth="1.6" />
          <path d="M6 5.5 7.2 8.2 10 8.5 8 10.5 8.5 13.2 6 11.8 3.5 13.2 4 10.5 2 8.5 4.8 8.2Z" />
        </g>
      ))}
    </>
  );
}

function TargetGlyph(): JSX.Element {
  return (
    <>
      <circle cx="32" cy="30" r="12" fill="none" strokeWidth="2" />
      <circle cx="32" cy="30" r="7" fill="none" strokeWidth="1.6" />
      <circle cx="32" cy="30" r="2.5" />
      <path
        d="M32 42v6M28 50h8M30 48l2 4 2-4"
        fill="none"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  );
}

function TrophyGlyph(): JSX.Element {
  return (
    <>
      <path
        d="M22 18h20v6c0 8-4 14-10 16-6-2-10-8-10-16V18Z"
        fill="none"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M22 22c-4 1-6 4-6 8M42 22c4 1 6 4 6 8" fill="none" strokeWidth="1.8" />
      <rect x="28" y="40" width="8" height="4" rx="1" />
      <rect x="24" y="46" width="16" height="4" rx="1.5" />
    </>
  );
}

function ChipStackGlyph(): JSX.Element {
  return (
    <>
      <ellipse cx="32" cy="44" rx="14" ry="5" fill="none" strokeWidth="1.8" />
      <ellipse cx="32" cy="38" rx="14" ry="5" fill="none" strokeWidth="1.8" />
      <ellipse cx="32" cy="32" rx="14" ry="5" fill="none" strokeWidth="1.8" />
      <path d="M18 32v12M46 32v12" fill="none" strokeWidth="1.8" />
      <ellipse cx="32" cy="26" rx="14" ry="5" strokeWidth="2" />
    </>
  );
}

function StarGlyph(): JSX.Element {
  return (
    <>
      <circle cx="32" cy="32" r="14" fill="none" strokeWidth="2" />
      <path d="M32 18l3.4 8.2 8.8.8-6.6 5.8 2 8.6L32 37.2 24.4 41.4l2-8.6-6.6-5.8 8.8-.8Z" />
    </>
  );
}

function FlameCardsGlyph(): JSX.Element {
  return (
    <>
      <CardsGlyph count={4} />
      <path
        d="M48 22c0 6-4 10-8 10 2-3 2-5 1-8 3 1 7-1 7-2Z"
        strokeWidth="1.2"
      />
    </>
  );
}

const GLYPHS: Record<string, () => JSX.Element> = {
  first_visit: DoorGlyph,
  visit_5: () => <ChipGlyph label="5" />,
  four_kind: () => <CardsGlyph count={4} />,
  first_knockout: TargetGlyph,
  royal_flush: () => <CardsGlyph count={5} />,
  visit_10: () => <ChipGlyph label="10" />,
  first_win: TrophyGlyph,
  straight_flush: FlameCardsGlyph,
  final_table: ChipStackGlyph,
  win_streak: StarGlyph,
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
  const Glyph = GLYPHS[id] ?? StarGlyph;
  return (
    <MedallionShell locked={locked} size={size}>
      <Glyph />
    </MedallionShell>
  );
}
