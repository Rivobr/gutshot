import { useEffect, useState } from 'react';
import { Card } from '@gutshot/ui';
import { motion } from 'framer-motion';
import QRCode from 'qrcode';

export interface QRCardProps {
  token: string;
  expiresAt: string;
}

export function QRCard({ token, expiresAt }: QRCardProps): JSX.Element {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 1000)),
  );

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(token, { width: 400, margin: 1, errorCorrectionLevel: 'M' })
      .then((url) => {
        if (!cancelled) {
          setDataUrl(url);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDataUrl('');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft(Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <Card className="flex flex-col items-center gap-4 py-8">
      <motion.div
        key={token}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex h-56 w-56 items-center justify-center rounded-lg bg-white p-4"
      >
        {dataUrl ? (
          <img src={dataUrl} alt="QR-код для Check-In" className="h-full w-full" />
        ) : (
          <div className="h-full w-full animate-pulse rounded bg-gray-200" />
        )}
      </motion.div>
      <p className="text-sm text-muted-foreground">Обновится через {secondsLeft} сек</p>
    </Card>
  );
}
