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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Печать для Xprinter XP-365B (термоэтикетка ~80 мм).
 * QR ровно 40×40 мм, прижат в левый верхний угол.
 */
function printBadge(dataUrl: string, code: string, name: string, username?: string | null): void {
  const win = window.open('', '_blank', 'width=480,height=360');
  if (!win) return;

  const safeName = escapeHtml(name);
  const safeCode = escapeHtml(code);
  const safeUser = username ? escapeHtml(username) : '';

  win.document.write(`<!doctype html>
<html lang="ru"><head><meta charset="utf-8" /><title>QR ${safeCode}</title>
<style>
  /* XP-365B: ширина рулона до ~80 мм, печать до 76 мм */
  @page { size: 80mm 50mm; margin: 0; }
  html, body {
    margin: 0;
    padding: 0;
    width: 80mm;
    height: 50mm;
    background: #fff;
    color: #000;
    font-family: Arial, Helvetica, sans-serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .label {
    position: relative;
    width: 80mm;
    height: 50mm;
    box-sizing: border-box;
    padding: 2mm;
    overflow: hidden;
  }
  .qr {
    position: absolute;
    top: 2mm;
    left: 2mm;
    width: 40mm;
    height: 40mm;
    display: block;
  }
  .meta {
    position: absolute;
    top: 2mm;
    left: 44mm;
    right: 2mm;
    bottom: 2mm;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    gap: 1.5mm;
    overflow: hidden;
  }
  .club {
    font-size: 7pt;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #333;
  }
  .name {
    font-size: 11pt;
    font-weight: 700;
    line-height: 1.15;
    word-break: break-word;
  }
  .username {
    font-size: 8pt;
    color: #444;
  }
  .code {
    margin-top: auto;
    font-size: 9pt;
    font-weight: 700;
    letter-spacing: 0.08em;
  }
  @media screen {
    body { background: #ddd; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .label { background: #fff; box-shadow: 0 2px 12px rgba(0,0,0,.2); }
  }
</style></head>
<body>
  <div class="label">
    <img class="qr" src="${dataUrl}" alt="QR" width="320" height="320" />
    <div class="meta">
      <div class="club">GUTSHOT</div>
      <div class="name">${safeName}</div>
      ${safeUser ? `<div class="username">@${safeUser}</div>` : ''}
      <div class="code">${safeCode}</div>
    </div>
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
