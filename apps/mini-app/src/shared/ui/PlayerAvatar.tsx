import { useState } from 'react';
import { initialsOf } from './figma';

export interface PlayerAvatarProps {
  photoUrl?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  nickname?: string | null;
  size?: number;
  className?: string;
}

export function PlayerAvatar({
  photoUrl,
  firstName,
  lastName,
  nickname,
  size = 80,
  className,
}: PlayerAvatarProps): JSX.Element {
  const [failed, setFailed] = useState(false);
  const initials = nickname?.trim()
    ? nickname.trim().slice(0, 2).toUpperCase()
    : initialsOf(firstName, lastName);

  const showPhoto = Boolean(photoUrl) && !failed;

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '9999px',
        overflow: 'hidden',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #9C6A1F 0%, #C89A3D 50%, #F7D98A 100%)',
        color: '#0A0A0A',
        fontSize: Math.round(size * 0.35),
        boxShadow:
          size >= 64
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
  );
}
