import { useState } from 'react';
import { initialsOf } from './figma';

export interface PlayerAvatarProps {
  photoUrl?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  nickname?: string | null;
  size?: number;
  className?: string;
  /** Золотая рамка / корона для «Легенды Gutshot». */
  legend?: boolean;
}

export function PlayerAvatar({
  photoUrl,
  firstName,
  lastName,
  nickname,
  size = 80,
  className,
  legend = false,
}: PlayerAvatarProps): JSX.Element {
  const [failed, setFailed] = useState(false);
  const initials = nickname?.trim()
    ? nickname.trim().slice(0, 2).toUpperCase()
    : initialsOf(firstName, lastName);

  const showPhoto = Boolean(photoUrl) && !failed;
  const ring = legend ? Math.max(3, Math.round(size * 0.06)) : size >= 64 ? 3 : 1;

  return (
    <div
      className={className}
      style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}
    >
      {legend && (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: -Math.round(size * 0.18),
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: Math.round(size * 0.28),
            lineHeight: 1,
            zIndex: 2,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.45))',
          }}
        >
          👑
        </span>
      )}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '9999px',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: legend
            ? 'linear-gradient(135deg, #B8860B 0%, #F7D98A 45%, #FFF4C2 55%, #C89A3D 100%)'
            : 'linear-gradient(135deg, #9C6A1F 0%, #C89A3D 50%, #F7D98A 100%)',
          color: '#0A0A0A',
          fontSize: Math.round(size * 0.35),
          boxShadow: legend
            ? `0 0 0 ${ring}px rgba(247,217,138,0.85), 0 0 0 ${ring + 3}px rgba(184,134,11,0.35), 0 0 28px rgba(247,217,138,0.45)`
            : size >= 64
              ? '0 0 0 3px rgba(199,154,61,0.18), 0 0 32px rgba(156,106,31,0.28)'
              : '0 0 0 1px rgba(199,154,61,0.2)',
        }}
      >
        {showPhoto ? (
          <img
            src={photoUrl ?? undefined}
            alt=""
            onError={() => setFailed(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span className="serif font-semibold">{initials}</span>
        )}
      </div>
    </div>
  );
}
