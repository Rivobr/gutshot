import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export interface QrScannerProps {
  onScan: (token: string) => void;
  active: boolean;
  /** Уникальный id контейнера — позволяет держать несколько сканеров в приложении. */
  elementId?: string;
}

async function safeStopAndClear(scanner: Html5Qrcode): Promise<void> {
  try {
    // html5-qrcode@2.3.8: stop() бросает синхронный throw, если сканер ещё не стартовал.
    if (scanner.isScanning) {
      await scanner.stop();
    }
  } catch {
    // already stopped / never started
  }

  try {
    scanner.clear();
  } catch {
    // ignore DOM cleanup races
  }
}

export function QrScanner({
  onScan,
  active,
  elementId = 'gutshot-qr-scanner',
}: QrScannerProps): JSX.Element {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onScanRef = useRef(onScan);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!active) {
      return;
    }

    const scanner = new Html5Qrcode(elementId);
    scannerRef.current = scanner;
    let cancelled = false;
    let startPromise: Promise<void> | null = null;

    startPromise = scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          onScanRef.current(decodedText);
        },
        () => {
          // Ошибки распознавания отдельных кадров игнорируем.
        },
      )
      .then(() => undefined)
      .catch(() => {
        if (!cancelled) {
          setError('Не удалось получить доступ к камере. Проверьте разрешения браузера.');
        }
      });

    return () => {
      cancelled = true;
      scannerRef.current = null;
      // Дожидаемся старта (или его ошибки), затем безопасно гасим камеру.
      void (startPromise ?? Promise.resolve()).finally(() => {
        void safeStopAndClear(scanner);
      });
    };
  }, [active, elementId]);

  return (
    <div className="flex flex-col gap-2">
      <div id={elementId} className="overflow-hidden rounded-lg" />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
