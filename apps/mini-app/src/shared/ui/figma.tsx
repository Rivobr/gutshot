import type { ReactNode } from 'react';

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }): JSX.Element {
  const cfg = {
    sm: { title: 12, sub: 7.5, gap: 2 },
    md: { title: 16, sub: 9, gap: 3 },
    lg: { title: 24, sub: 11, gap: 4 },
  }[size];

  return (
    <div className="flex flex-col items-center" style={{ gap: cfg.gap }}>
      <div className="flex items-center gap-2">
        <svg width={cfg.title * 0.55} height={cfg.title * 0.55} viewBox="0 0 20 20" fill="none">
          <path
            d="M10 1 L12.5 7.5 L19 8.5 L14.5 13 L15.8 19.5 L10 16.5 L4.2 19.5 L5.5 13 L1 8.5 L7.5 7.5 Z"
            fill="url(#lg1)"
          />
          <defs>
            <linearGradient id="lg1" x1="0" y1="0" x2="20" y2="20">
              <stop stopColor="#9C6A1F" />
              <stop offset="0.5" stopColor="#F7D98A" />
              <stop offset="1" stopColor="#9C6A1F" />
            </linearGradient>
          </defs>
        </svg>
        <span
          className="gold-text serif tracking-widest font-semibold"
          style={{ fontSize: cfg.title, letterSpacing: '0.2em', lineHeight: 1 }}
        >
          GUTSHOT
        </span>
        <svg width={cfg.title * 0.55} height={cfg.title * 0.55} viewBox="0 0 20 20" fill="none">
          <path
            d="M10 1 L12.5 7.5 L19 8.5 L14.5 13 L15.8 19.5 L10 16.5 L4.2 19.5 L5.5 13 L1 8.5 L7.5 7.5 Z"
            fill="url(#lg2)"
          />
          <defs>
            <linearGradient id="lg2" x1="0" y1="0" x2="20" y2="20">
              <stop stopColor="#9C6A1F" />
              <stop offset="0.5" stopColor="#F7D98A" />
              <stop offset="1" stopColor="#9C6A1F" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="gold-divider w-full" style={{ opacity: 0.55 }} />
      <span
        className="sans uppercase tracking-widest"
        style={{
          fontSize: cfg.sub,
          color: 'rgba(199,154,61,0.65)',
          letterSpacing: '0.28em',
          lineHeight: 1,
        }}
      >
        Poker Club
      </span>
    </div>
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
