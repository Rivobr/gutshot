export type PlatePrintSize = '40mm' | '40cm';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Печать квадратной таблички GUTSHOT с цифрой.
 * 40mm — наклейка как QR (XP-365B). 40cm — лист в типографию / большой принтер.
 */
export function printNumberPlate(rawNumber: string, size: PlatePrintSize): void {
  const number = rawNumber.trim() || '4999';
  const win = window.open('', '_blank', 'width=720,height=800');
  if (!win) {
    window.alert('Разрешите всплывающие окна, чтобы открыть печать.');
    return;
  }

  const safe = escapeHtml(number);
  const page = size === '40cm' ? '40cm 40cm' : '40mm 40mm';
  const title = size === '40cm' ? `GUTSHOT ${safe} · 40×40 см` : `GUTSHOT ${safe} · 40×40 мм`;

  const printScale = size === '40cm' ? 10 : 1;
  const u = (n: number): string => `calc(${n}mm * var(--s))`;

  win.document.write(`<!doctype html>
<html lang="ru"><head><meta charset="utf-8" /><title>${title}</title>
<style>
  * { box-sizing: border-box; }
  :root { --s: 1; }
  html, body {
    margin: 0;
    padding: 0;
    background: #090909;
    color: #f5edd6;
    font-family: Georgia, 'Times New Roman', serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  @page { size: ${page}; margin: 0; }

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
      max-width: 280px;
      color: #ddd;
      font-size: 12px;
      text-align: center;
      line-height: 1.4;
      font-family: Arial, Helvetica, sans-serif;
    }
    .plate { transform: scale(2.65); transform-origin: center; }
  }

  @media print {
    :root { --s: ${printScale}; }
    html, body { width: 100%; height: 100%; background: #090909; }
    .hint { display: none !important; }
  }

  .plate {
    position: relative;
    width: ${u(40)};
    height: ${u(40)};
    overflow: hidden;
    background: radial-gradient(ellipse at 50% 40%, #1c160e 0%, #090909 72%);
    border: ${u(0.64)} solid #c89a3d;
    box-shadow:
      inset 0 0 0 ${u(0.24)} #7d5417,
      inset 0 0 0 ${u(0.88)} #090909,
      inset 0 0 0 ${u(1.08)} #f7d98a;
  }
  .plate::before {
    content: '';
    position: absolute;
    inset: ${u(2.4)};
    border: ${u(0.12)} solid rgba(247,217,138,0.35);
    pointer-events: none;
  }
  .corners span {
    position: absolute;
    width: ${u(3.2)};
    height: ${u(3.2)};
    border: ${u(0.16)} solid #f7d98a;
  }
  .corners .tl { top: ${u(2.8)}; left: ${u(2.8)}; border-right: 0; border-bottom: 0; }
  .corners .tr { top: ${u(2.8)}; right: ${u(2.8)}; border-left: 0; border-bottom: 0; }
  .corners .bl { bottom: ${u(2.8)}; left: ${u(2.8)}; border-right: 0; border-top: 0; }
  .corners .br { bottom: ${u(2.8)}; right: ${u(2.8)}; border-left: 0; border-top: 0; }

  .brand {
    position: absolute;
    top: ${u(4.4)};
    left: 0;
    right: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: ${u(0.28)};
  }
  .bars { display: flex; align-items: flex-end; gap: ${u(0.36)}; height: ${u(2.6)}; }
  .bars i {
    display: block;
    width: ${u(0.72)};
    height: 100%;
    border-radius: 20%;
    background: linear-gradient(180deg, #7d5417 0%, #c89a3d 42%, #f7d98a 58%, #8a5c1c 100%);
  }
  .bars i.ruby {
    background: linear-gradient(180deg, #7a0b2c 0%, #e0115f 45%, #ff4d7d 60%, #a10d3d 100%);
  }
  .word {
    font-size: ${u(2.7)};
    font-weight: 700;
    letter-spacing: 0.18em;
    color: #f7d98a;
    line-height: 1;
  }
  .sub {
    font-family: Arial, Helvetica, sans-serif;
    font-size: ${u(1.05)};
    letter-spacing: 0.34em;
    color: rgba(199,154,61,0.7);
  }
  .num {
    position: absolute;
    inset: 34% 4% 20%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: ${u(12.4)};
    font-weight: 700;
    letter-spacing: 0.02em;
    line-height: 1;
    background: linear-gradient(180deg, #9c6a1f 0%, #f7d98a 45%, #c89a3d 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: #f7d98a;
  }
  .foot {
    position: absolute;
    left: ${u(5.6)};
    right: ${u(5.6)};
    bottom: ${u(3.4)};
    text-align: center;
    font-family: Arial, Helvetica, sans-serif;
  }
  .foot hr {
    border: 0;
    border-top: ${u(0.1)} solid #c89a3d;
    margin: 0 0 ${u(0.7)};
  }
  .foot .city {
    font-size: ${u(1.28)};
    letter-spacing: 0.16em;
    color: #8a7a55;
  }
  .foot .addr {
    margin-top: ${u(0.28)};
    font-size: ${u(0.98)};
    letter-spacing: 0.12em;
    color: #6b614e;
  }
</style></head>
<body>
  <div class="hint">Превью таблички ${safe}. В диалоге печати выберите размер ${size === '40cm' ? '40×40 см' : '40×40 мм'} без полей.</div>
  <div class="plate">
    <div class="corners" aria-hidden="true">
      <span class="tl"></span><span class="tr"></span><span class="bl"></span><span class="br"></span>
    </div>
    <div class="brand">
      <div class="bars" aria-hidden="true"><i></i><i></i><i class="ruby"></i><i></i><i></i></div>
      <div class="word">GUTSHOT</div>
      <div class="sub">POKER CLUB</div>
    </div>
    <div class="num">${safe}</div>
    <div class="foot">
      <hr />
      <div class="city">САНКТ-ПЕТЕРБУРГ</div>
      <div class="addr">МИЛЛИОННАЯ, 19</div>
    </div>
  </div>
  <script>window.onload = function () { window.focus(); window.print(); };</script>
</body></html>`);
  win.document.close();
}
