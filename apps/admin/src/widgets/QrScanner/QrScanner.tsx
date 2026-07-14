import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export interface QrScannerProps {
  onScan: (token: string) => void;
  active: boolean;
}

const SCANNER_ELEMENT_ID = 'gutshot-qr-scanner';

export function QrScanner({ onScan, active }: QrScannerProps): JSX.Element {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active) {
      return;
    }

    const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
    scannerRef.current = scanner;
    let stopped = false;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          onScan(decodedText);
        },
        () => {
          // Ошибки распознавания отдельных кадров игнорируем.
        },
      )
      .catch(() => {
        setError('Не удалось получить доступ к камере. Проверьте разрешения браузера.');
      });

    return () => {
      stopped = true;
      scanner
        .stop()
        .catch(() => undefined)
        .finally(() => {
          if (stopped) {
            scanner.clear();
          }
        });
    };
  }, [active, onScan]);

  return (
    <div className="flex flex-col gap-2">
      <div id={SCANNER_ELEMENT_ID} className="overflow-hidden rounded-lg" />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
