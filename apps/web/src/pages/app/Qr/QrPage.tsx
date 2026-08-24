import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import QRCode from 'qrcode';
import { apiGet } from '@/shared/api/client';
import type { PlayerProfileDto } from '@gutshot/types';

export function QrPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState('');
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => apiGet<PlayerProfileDto>('/profile'),
  });

  const isDesktop = window.innerWidth >= 1024;

  useEffect(() => {
    if (!profile?.qrCode || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, profile.qrCode, {
      width: Math.min(420, window.innerWidth - 96),
      margin: 2,
      color: { dark: '#f5edd6', light: '#090909' },
      errorCorrectionLevel: 'M',
    }).catch(() => setError('Не удалось построить QR — обновите страницу'));
  }, [profile]);

  return (
    <div className="stack-16 center" style={{ alignItems: 'center' }}>
      <h1 className="serif" style={{ fontSize: 26, textTransform: 'uppercase' }}>
        Мой QR
      </h1>

      {isDesktop && (
        <div className="note gold" style={{ display: 'inline-block', textAlign: 'left' }}>
          На компьютере QR не показывают на входе — откройте эту страницу с телефона.
          <br />
          Ссылка: <b style={{ color: 'var(--gold)' }}>gutshot.club/app/qr</b>
        </div>
      )}

      <div className="vip-card center" style={{ padding: 32, display: 'inline-block' }}>
        {profile?.qrCode ? (
          <canvas ref={canvasRef} style={{ display: 'block', margin: '0 auto' }} />
        ) : error ? (
          <p className="note" style={{ color: '#d98f85' }}>
            {error}
          </p>
        ) : (
          <p className="muted" style={{ padding: 40 }}>
            Строим QR…
          </p>
        )}
        <p className="hint mt-16">
          Покажите код на входе — администратор отсканирует.
          <br />
          Код постоянный, никому его не пересылайте.
        </p>
      </div>
    </div>
  );
}
