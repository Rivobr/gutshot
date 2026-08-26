export type PlatePrintSize = '40mm' | '40cm';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function oswaldFontFace(origin: string): string {
  const base = `${origin}/fonts`;
  return `
@font-face {
  font-family: 'Oswald';
  font-style: normal;
  font-weight: 600;
  font-display: block;
  src: url('${base}/oswald-cyrillic.woff2') format('woff2');
  unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
}
@font-face {
  font-family: 'Oswald';
  font-style: normal;
  font-weight: 600;
  font-display: block;
  src: url('${base}/oswald-latin-ext.woff2') format('woff2');
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
@font-face {
  font-family: 'Oswald';
  font-style: normal;
  font-weight: 600;
  font-display: block;
  src: url('${base}/oswald-latin.woff2') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}`;
}

/**
 * Печать ценника мерча 40×40: макет с фото + цена из поля.
 * 40mm — наклейка XP-365B. 40cm — лист в типографию.
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
  const title = size === '40cm' ? `Ценник ${safe} ₽ · 40×40 см` : `Ценник ${safe} ₽ · 40×40 мм`;
  const printScale = size === '40cm' ? 10 : 1;
  const origin = window.location.origin;
  const art = `${origin}/merch-price-tag.jpg`;
  const fontMm = number.length <= 4 ? 5.2 : number.length === 5 ? 4.3 : 3.5;

  win.document.write(`<!doctype html>
<html lang="ru"><head><meta charset="utf-8" /><title>${title}</title>
<style>
  ${oswaldFontFace(origin)}
  * { box-sizing: border-box; }
  :root { --s: 1; }
  html, body {
    margin: 0;
    padding: 0;
    background: #fefefe;
    color: #111;
    font-family: 'Oswald', 'Arial Narrow', Arial, sans-serif;
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
    html, body { width: 100%; height: 100%; background: #fefefe; }
    .hint { display: none !important; }
  }

  .plate {
    position: relative;
    width: calc(40mm * var(--s));
    height: calc(40mm * var(--s));
    overflow: hidden;
    background: #fefefe;
  }
  .plate img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .price-mask {
    position: absolute;
    left: 14%;
    right: 14%;
    top: 77.6%;
    bottom: 4.4%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fefefe;
  }
  .price {
    font-size: calc(${fontMm}mm * var(--s));
    font-weight: 600;
    letter-spacing: 0.01em;
    line-height: 1;
    color: #111;
    white-space: nowrap;
    transform: scaleY(1.18);
  }
</style></head>
<body>
  <div class="hint">Превью ценника ${safe} ₽. В диалоге печати выберите размер ${size === '40cm' ? '40×40 см' : '40×40 мм'} без полей.</div>
  <div class="plate">
    <img src="${art}" alt="" />
    <div class="price-mask"><span class="price">${safe}&nbsp;₽</span></div>
  </div>
  <script>
    var printed = false;
    function goPrint() {
      if (printed) return;
      printed = true;
      window.focus();
      window.print();
    }
    window.onload = function () {
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(goPrint).catch(goPrint);
        setTimeout(goPrint, 1800);
      } else {
        goPrint();
      }
    };
  </script>
</body></html>`);
  win.document.close();
}
