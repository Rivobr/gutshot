/** HTML-табло без JavaScript — для Xiaomi YaBrowser Lite. */

type BoardLike = {
  tournament?: { title?: string | null } | null;
  clock?: {
    status?: string | null;
    secondsLeft?: number | null;
    secondsToBreak?: number | null;
    levelEndsAt?: string | null;
    breakAt?: string | null;
    serverTime?: string | null;
    playersIn?: number | null;
    current?: {
      number?: number | null;
      isBreak?: boolean | null;
      smallBlind?: number | null;
      bigBlind?: number | null;
      ante?: number | null;
    } | null;
    next?: {
      isBreak?: boolean | null;
      smallBlind?: number | null;
      bigBlind?: number | null;
    } | null;
  } | null;
} | null;

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatClock(totalSec: number | null | undefined): string {
  if (totalSec == null || Number.isNaN(totalSec) || totalSec < 0) return '—';
  const sec = Math.floor(totalSec);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

function formatAmount(value: number | null | undefined): string {
  if (value == null) return '—';
  try {
    return Number(value).toLocaleString('ru-RU');
  } catch {
    return String(value);
  }
}

function liveSecondsLeft(
  endsAt: string | null | undefined,
  serverTime: string | null | undefined,
  fallback: number | null | undefined,
): number | null {
  if (endsAt && serverTime) {
    const end = new Date(endsAt).getTime();
    const now = new Date(serverTime).getTime();
    if (!Number.isNaN(end) && !Number.isNaN(now)) {
      return Math.max(0, Math.round((end - now) / 1000));
    }
  }
  return fallback ?? null;
}

export function renderBoardHtml(board: BoardLike): string {
  const refresh = 5;
  if (!board?.clock) {
    return `<!doctype html>
<html lang="ru"><head>
<meta charset="utf-8"/>
<meta http-equiv="refresh" content="${refresh}"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>GUTSHOT — табло</title>
<style>
html,body{margin:0;height:100%;background:#090907;color:#f7d98a;font-family:Arial,Helvetica,sans-serif}
.wrap{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
h1{letter-spacing:.22em;font-size:48px;margin:0}
p{color:#7a6e5a;letter-spacing:.12em;text-transform:uppercase;font-size:22px}
</style></head>
<body><div class="wrap"><h1>GUTSHOT</h1><p>Ближайших турниров нет</p></div></body></html>`;
  }

  const clock = board.clock;
  const current = clock.current || {};
  const isBreak = !!current.isBreak;
  const running = clock.status === 'RUNNING';
  const levelLeft = liveSecondsLeft(clock.levelEndsAt, clock.serverTime, clock.secondsLeft);
  const breakLeft = liveSecondsLeft(clock.breakAt, clock.serverTime, clock.secondsToBreak);
  const title = esc(board.tournament?.title || 'Турнир');

  let nextBlinds = '';
  if (clock.next && !clock.next.isBreak) {
    nextBlinds = `${formatAmount(clock.next.smallBlind)} / ${formatAmount(clock.next.bigBlind)}`;
  } else if (clock.next?.isBreak) {
    nextBlinds = 'Перерыв';
  }

  let statusText = 'Пауза';
  if (running) statusText = 'LIVE';
  else if (clock.status === 'IDLE') statusText = 'Скоро старт';
  else if (clock.status === 'FINISHED') statusText = 'Финиш';

  const center = isBreak
    ? `<div class="break"><div class="lbl">Перерыв</div><div class="big">${formatClock(levelLeft)}</div></div>`
    : `<div class="blinds">
        <div class="blind"><div class="lbl">Малый</div><div class="big">${formatAmount(current.smallBlind)}</div></div>
        <div class="sep"></div>
        <div class="blind"><div class="lbl">Большой</div><div class="big">${formatAmount(current.bigBlind)}</div></div>
      </div>`;

  return `<!doctype html>
<html lang="ru"><head>
<meta charset="utf-8"/>
<meta http-equiv="refresh" content="${refresh}"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>GUTSHOT — ${title}</title>
<style>
html,body{margin:0;height:100%;background:#090907;color:#f5edd6;font-family:Arial,Helvetica,sans-serif;overflow:hidden}
.board{height:100%;padding:3vh 4vw;box-sizing:border-box;display:flex;flex-direction:column;background:linear-gradient(180deg,#120e09 0%,#090907 45%,#0c0a08 100%)}
.head{text-align:center}
.wordmark{font-size:42px;font-weight:700;letter-spacing:.22em;color:#f7d98a;margin:0}
.rule{width:40%;max-width:520px;height:1px;margin:1.2vh auto;background:#c89a3d}
.event{font-size:16px;letter-spacing:.24em;text-transform:uppercase;color:#f7d98a;opacity:.85}
.center{flex:1;display:flex;align-items:center;justify-content:center;min-height:0}
.blinds{display:flex;align-items:center;justify-content:center}
.blind{text-align:center;margin:0 36px}
.lbl{font-size:16px;letter-spacing:.26em;text-transform:uppercase;color:#c89a3d;font-weight:700}
.big{font-family:Georgia,'Times New Roman',serif;font-weight:700;font-size:120px;line-height:.95;color:#fff8e6;margin-top:8px}
.sep{width:2px;height:120px;background:#c89a3d}
.break{text-align:center}
.next{text-align:center;color:#7a6e5a;letter-spacing:.18em;text-transform:uppercase;font-size:16px;margin:0 0 1vh}
.next b{color:#f7d98a;margin-left:.5em}
.stats{display:flex;border-top:1px solid rgba(199,154,61,.22);padding:2vh 0 1.5vh}
.stat{flex:1;text-align:center}
.stat .lbl{font-size:14px}
.stat .val{font-family:Georgia,serif;font-size:48px;font-weight:700;margin-top:6px;color:#f5edd6}
.foot{display:flex;justify-content:space-between;align-items:center;padding-top:1vh;color:#7a6e5a;letter-spacing:.16em;text-transform:uppercase;font-size:16px;font-weight:700}
.foot b{color:#f5edd6;margin-left:.45em}
.pill{border:1px solid rgba(199,154,61,.5);background:rgba(199,154,61,.12);color:#f7d98a;border-radius:999px;padding:.4em 1em}
</style></head>
<body>
<div class="board">
  <header class="head">
    <h1 class="wordmark">GUTSHOT</h1>
    <div class="rule"></div>
    <div class="event">${title}</div>
  </header>
  <main class="center">${center}</main>
  ${nextBlinds && clock.status !== 'FINISHED' ? `<p class="next">Далее<b>${esc(nextBlinds)}</b></p>` : ''}
  <section class="stats">
    <div class="stat"><div class="lbl">Уровень</div><div class="val">${isBreak ? '—' : current.number != null ? esc(String(current.number)) : '—'}</div></div>
    <div class="stat"><div class="lbl">${isBreak ? 'До продолжения' : 'До смены'}</div><div class="val">${formatClock(levelLeft)}</div></div>
    <div class="stat"><div class="lbl">До перерыва</div><div class="val">${isBreak ? 'Идёт' : formatClock(breakLeft)}</div></div>
  </section>
  <footer class="foot">
    <span>Играют<b>${clock.playersIn != null ? esc(String(clock.playersIn)) : '—'}</b></span>
    <span class="pill">${esc(statusText)}</span>
    <span>Ante<b>${isBreak ? '—' : formatAmount(current.ante)}</b></span>
  </footer>
</div>
</body></html>`;
}
