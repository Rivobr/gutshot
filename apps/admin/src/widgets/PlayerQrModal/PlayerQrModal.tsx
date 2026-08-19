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
 * Превью — клубная карточка (86×54).
 * В печать уходит только белый квадрат QR 40×40 мм (наклейка на карту / XP-365B).
 */
function printBadge(dataUrl: string, code: string, name: string, username?: string | null): void {
  const win = window.open('', '_blank', 'width=720,height=480');
  if (!win) return;

  const safeName = escapeHtml(name);
  const safeCode = escapeHtml(code);
  const safeUser = username ? escapeHtml(username) : '';

  win.document.write(`<!doctype html>
<html lang="ru"><head><meta charset="utf-8" /><title>QR ${safeCode}</title>
<style>
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    background: #fff;
    color: #f3e2b0;
    font-family: Arial, Helvetica, sans-serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* Экран: вся карточка как на фото */
  @media screen {
    body {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 14px;
      background: #2a2a2a;
      padding: 20px;
    }
    .hint {
      display: block;
      max-width: 86mm;
      color: #ddd;
      font-size: 12px;
      text-align: center;
      line-height: 1.35;
    }
    .card {
      position: relative;
      width: 86mm;
      height: 54mm;
      overflow: hidden;
      background:
        radial-gradient(ellipse at 20% 30%, rgba(200,154,61,0.12), transparent 45%),
        radial-gradient(ellipse at 80% 70%, rgba(140,90,30,0.1), transparent 40%),
        #141210;
      border: 0.35mm solid #c89a3d;
      box-shadow: 0 8px 28px rgba(0,0,0,.45);
    }
    .frame {
      position: absolute;
      inset: 2.2mm;
      border: 0.35mm solid #c89a3d;
      border-radius: 1.2mm;
    }
    .brand {
      position: absolute;
      left: 4.5mm;
      top: 4.5mm;
      bottom: 4.5mm;
      width: 34mm;
      display: flex;
      align-items: center;
      gap: 2.2mm;
    }
    .bars {
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 1.6mm;
      height: 28mm;
    }
    .bars span {
      display: block;
      width: 7mm;
      height: 2.4mm;
      border-radius: 0.4mm;
      background: linear-gradient(90deg, #8a5c1c, #c89a3d 45%, #f0d48a);
    }
    .bars span.ruby {
      background: linear-gradient(90deg, #7a0b2c, #e0115f 50%, #ff4d7d);
    }
    .titles {
      display: flex;
      align-items: center;
      gap: 1.8mm;
      height: 100%;
    }
    .gutshot {
      writing-mode: vertical-rl;
      transform: rotate(180deg);
      font-size: 15.5pt;
      font-weight: 800;
      letter-spacing: 0.08em;
      line-height: 1;
      color: #d7b056;
      text-transform: uppercase;
    }
    .poker {
      writing-mode: vertical-rl;
      transform: rotate(180deg);
      font-size: 6.2pt;
      font-weight: 600;
      letter-spacing: 0.22em;
      color: #f5f0e6;
      text-transform: uppercase;
    }
    .qr-slot {
      position: absolute;
      top: 7mm;
      right: 4.5mm;
      width: 40mm;
      height: 40mm;
      background: #fff;
      border-radius: 2.2mm;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .qr-slot img {
      width: 40mm;
      height: 40mm;
      display: block;
    }
    .meta {
      position: absolute;
      left: 4.5mm;
      right: 46mm;
      bottom: 3.2mm;
      font-size: 5.5pt;
      line-height: 1.25;
      color: rgba(245,240,230,0.72);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  /* Печать / XP-365B: только наклейка 40×40 под белый квадрат карты */
  @media print {
    @page { size: 40mm 40mm; margin: 0; }
    html, body {
      width: 40mm;
      height: 40mm;
      background: #fff;
    }
    .hint, .frame, .brand, .meta { display: none !important; }
    .card {
      width: 40mm;
      height: 40mm;
      border: 0;
      background: #fff;
      overflow: hidden;
    }
    .qr-slot {
      position: static;
      width: 40mm;
      height: 40mm;
      border-radius: 0;
      background: #fff;
    }
    .qr-slot img {
      width: 40mm;
      height: 40mm;
      display: block;
    }
  }
</style></head>
<body>
  <div class="hint">Превью карточки. В печать уйдёт только QR 40×40 мм — наклейка на белый квадрат.</div>
  <div class="card">
    <div class="frame"></div>
    <div class="brand">
      <div class="bars" aria-hidden="true">
        <span></span><span class="ruby"></span><span></span><span></span>
      </div>
      <div class="titles">
        <div class="gutshot">GUTSHOT</div>
        <div class="poker">POKER CLUB</div>
      </div>
    </div>
    <div class="qr-slot">
      <img src="${dataUrl}" alt="QR" width="320" height="320" />
    </div>
    <div class="meta">${safeName}${safeUser ? ` · @${safeUser}` : ''} · ${safeCode}</div>
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
    // margin: 1 — тихая зона внутри белого квадрата 40×40 на карточке
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
                Печать карточки
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
