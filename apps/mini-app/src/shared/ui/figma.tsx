import type { ReactNode } from 'react';

export function BrandMark({ height = 26 }: { height?: number }): JSX.Element {
  const barW = height * 0.16;
  const gap = height * 0.11;
  const bars = [0, 1, 2, 3, 4];
  return (
    <div className="flex items-end justify-center" style={{ gap }}>
      {bars.map((i) => {
        const ruby = i === 2;
        return (
          <span
            key={i}
            style={{
              width: barW,
              height,
              borderRadius: barW * 0.28,
              background: ruby
                ? 'linear-gradient(150deg,#7a0b2c 0%,#e0115f 45%,#ff4d7d 60%,#a10d3d 100%)'
                : 'linear-gradient(150deg,#7d5417 0%,#c89a3d 42%,#f7d98a 58%,#8a5c1c 100%)',
              boxShadow: ruby
                ? '0 0 10px rgba(224,17,95,0.5), inset 0 1px 0 rgba(255,255,255,0.35)'
                : '0 1px 4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.3)',
            }}
          />
        );
      })}
    </div>
  );
}

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }): JSX.Element {
  const cfg = {
    sm: { title: 14, sub: 7, gap: 4, mark: 15 },
    md: { title: 19, sub: 8.5, gap: 5, mark: 20 },
    lg: { title: 27, sub: 11, gap: 7, mark: 30 },
  }[size];

  return (
    <div className="flex flex-col items-center" style={{ gap: cfg.gap }}>
      <BrandMark height={cfg.mark} />
      <span
        className="gold-text serif font-semibold"
        style={{ fontSize: cfg.title, letterSpacing: '0.16em', lineHeight: 1 }}
      >
        GUTSHOT
      </span>
      <span
        className="sans uppercase"
        style={{
          fontSize: cfg.sub,
          color: 'rgba(199,154,61,0.6)',
          letterSpacing: '0.34em',
          lineHeight: 1,
        }}
      >
        Poker Club
      </span>
    </div>
  );
}

const SUIT_PATHS: Record<string, string> = {
  spade:
    'M32 6C22 18 10 26 10 38a11 11 0 0 0 19 8c-1 6-3 9-7 12h20c-4-3-6-6-7-12a11 11 0 0 0 19-8c0-12-12-20-22-32Z',
  club:
    'M32 8a10 10 0 0 0-8 16 11 11 0 1 0-2 21c3 0 6-1 8-3-1 5-3 8-6 12h16c-3-4-5-7-6-12 2 2 5 3 8 3a11 11 0 1 0-2-21 10 10 0 0 0-8-16Z',
  diamond: 'M32 4 54 34 32 64 10 34Z',
  heart:
    'M32 58C12 44 8 30 8 22a12 12 0 0 1 24-4 12 12 0 0 1 24 4c0 8-4 22-24 36Z',
};

export function SuitWatermark({
  suit = 'spade',
  className = '',
  style,
}: {
  suit?: 'spade' | 'club' | 'diamond' | 'heart';
  className?: string;
  style?: React.CSSProperties;
}): JSX.Element {
  return (
    <svg
      viewBox="0 0 64 68"
      className={className}
      style={style}
      fill="none"
      aria-hidden
    >
      <path d={SUIT_PATHS[suit]} fill="url(#suitGrad)" />
      <defs>
        <linearGradient id="suitGrad" x1="0" y1="0" x2="64" y2="68">
          <stop stopColor="#C89A3D" stopOpacity="0.9" />
          <stop offset="1" stopColor="#5a3f16" stopOpacity="0.6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function GoldBadge({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 status-upcoming rounded-full sans ${className}`}
      style={{ fontSize: 9, letterSpacing: '0.12em' }}
    >
      {children}
    </span>
  );
}

export function Divider({ className = '' }: { className?: string }): JSX.Element {
  return <div className={`gold-divider ${className}`} />;
}

export function InfoCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}): JSX.Element {
  return (
    <div className="flex flex-col gap-1.5 p-4 rounded-[18px] vip-card">
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span
        className="sans font-semibold"
        style={{ fontSize: 14, color: '#F5EDD6', lineHeight: 1.3 }}
      >
        {value}
      </span>
      <span
        className="sans uppercase"
        style={{ fontSize: 9, color: '#6B614E', letterSpacing: '0.14em' }}
      >
        {label}
      </span>
    </div>
  );
}

export function StatPill({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}): JSX.Element {
  return (
    <div
      className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-2xl vip-card"
      style={{ minWidth: 72 }}
    >
      <span
        className={`num font-semibold ${accent ? 'gold-text' : ''}`}
        style={{ fontSize: 16, color: accent ? undefined : '#F5EDD6', lineHeight: 1 }}
      >
        {value}
      </span>
      <span
        className="sans uppercase"
        style={{ fontSize: 8, color: '#6B614E', letterSpacing: '0.16em' }}
      >
        {label}
      </span>
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }): JSX.Element {
  return (
    <p
      className="sans uppercase"
      style={{ fontSize: 9, color: '#6B614E', letterSpacing: '0.18em' }}
    >
      {children}
    </p>
  );
}

export function goldButtonStyle(): React.CSSProperties {
  return {
    background: 'linear-gradient(135deg, #9C6A1F 0%, #C89A3D 40%, #F7D98A 70%, #C89A3D 100%)',
    color: '#0A0A0A',
    fontSize: 13,
    letterSpacing: '0.16em',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 28px rgba(156,106,31,0.4)',
  };
}

export function initialsOf(firstName?: string | null, lastName?: string | null): string {
  const a = firstName?.trim()?.[0] ?? '';
  const b = lastName?.trim()?.[0] ?? '';
  return (a + b).toUpperCase() || '♠';
}
