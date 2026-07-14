import { cn } from './lib/cn';

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: number;
  className?: string;
}

export function Avatar({ src, alt, fallback = '?', size = 48, className }: AvatarProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center overflow-hidden rounded-full bg-secondary text-secondary-foreground font-medium',
        className,
      )}
      style={{ width: size, height: size }}
    >
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <span>{fallback.slice(0, 2).toUpperCase()}</span>
      )}
    </div>
  );
}
