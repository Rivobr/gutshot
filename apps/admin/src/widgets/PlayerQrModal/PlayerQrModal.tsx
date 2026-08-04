import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import { Button } from '@gutshot/ui';

export interface PlayerQrModalProps {
  open: boolean;
  qrCode: string | null;
  playerName: string;
  username?: string | null;
  onClose: () => void;
}

/** Печатный бейдж игрока: открывается в отдельном окне и уходит в печать/PDF. */
function printBadge(dataUrl: string, code: string, name: string, username?: string | null): void {
  const win = window.open('', '_blank', 'width=720,height=900');
  if (!win) return;

  win.document.write(`<!doctype html>
<html lang="ru"><head><meta charset="utf-8" /><title>QR ${code}</title>
<style>
  @page { size: A4; margin: 18mm; }
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; color: #111; }
  .badge { display: flex; flex-direction: column; align-items: center; gap: 14px;
           border: 2px solid #C89A3D; border-radius: 18px; padding: 28px 24px; text-align: center; }
  .club { font-size: 13px; letter-spacing: 0.28em; text-transform: uppercase; color: #8A7A62; }
  .name { font-size: 26px; font-weight: 700; }
  .username { font-size: 14px; color: #666; }
  img { width: 320px; height: 320px; }
  .code { font-size: 20px; font-weight: 700; letter-spacing: 0.14em; color: #8A5C1C; }
  .hint { font-size: 12px; color: #777; max-width: 340px; line-height: 1.5; }
</style></head>
<body>
  <div class="badge">
    <div class="club">GUTSHOT Poker Club</div>
    <div class="name">${name}</div>
    ${username ? `<div class="username">@${username}</div>` : ''}
    <img src="${dataUrl}" alt="QR" />
    <div class="code">${code}</div>
    <div class="hint">Покажите этот код администратору клуба для отметки явки и событий турнира.</div>
  </div>
  <script>window.onload = function () { window.focus(); window.print(); };</script>
</body></html>`);
  win.document.close();
}

export function PlayerQrModal({
  open,
  qrCode,
  playerName,
  username,
  onClose,
}: PlayerQrModalProps): JSX.Element | null {
  const [dataUrl, setDataUrl] = useState('');

  useEffect(() => {
    if (!open || !qrCode) {
      setDataUrl('');
      return;
    }

    let cancelled = false;
    QRCode.toDataURL(qrCode, { width: 640, margin: 1, errorCorrectionLevel: 'M' })
      .then((url) => !cancelled && setDataUrl(url))
      .catch(() => !cancelled && setDataUrl(''));

    return () => {
      cancelled = true;
    };
  }, [open, qrCode]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const download = () => {
    if (!dataUrl || !qrCode) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `gutshot-qr-${qrCode}.png`;
    link.click();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-sm rounded-xl border border-border bg-card p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-medium">{playerName}</h3>
            {username && <p className="truncate text-xs text-muted-foreground">@{username}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="rounded-md px-2 text-xl leading-none text-muted-foreground"
          >
            ×
          </button>
        </div>

        {qrCode ? (
          <>
            <div className="flex justify-center rounded-lg bg-white p-4">
              {dataUrl ? (
                <img src={dataUrl} alt="QR игрока" className="h-56 w-56" />
              ) : (
                <div className="h-56 w-56 animate-pulse rounded bg-gray-200" />
              )}
            </div>
            <p className="mt-3 text-center text-sm font-semibold tracking-widest text-primary">
              {qrCode}
            </p>

            <div className="mt-4 flex gap-2">
              <Button
                className="flex-1"
                onClick={() => dataUrl && printBadge(dataUrl, qrCode, playerName, username)}
              >
                Печать
              </Button>
              <Button variant="secondary" className="flex-1" onClick={download}>
                Скачать PNG
              </Button>
            </div>
          </>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            У игрока ещё нет QR-кода. Он появится после первого входа в Mini App.
          </p>
        )}
      </div>
    </div>,
    document.body,
  );
}
