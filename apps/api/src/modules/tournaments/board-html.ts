/**
 * HTML-табло для Xiaomi TV — в реальном времени.
 * - При RUNNING таймер считает от levelEndsAt каждую секунду (inline JS).
 * - Данные с сервера (пауза/блейнды/игроки) подтягиваются каждую 1с.
 * - Без JS: meta refresh 1с (YaBrowser Lite иногда не выполняет скрипты).
 * Внешние .js файлы YaBrowser Lite не загружает — только inline в этой странице.
 */

type BoardLike = {
  tournament?: { id?: string | null; title?: string | null } | null;
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

/** Фирменный знак: 5 полосок без текста GUTSHOT. */
const LOGO_MARK = `<div class="logo" aria-hidden="true"><span class="bar"></span><span class="bar"></span><span class="bar ruby"></span><span class="bar"></span><span class="bar"></span></div>`;

const LOGO_CSS = `.logo{display:inline-flex;align-items:flex-end;justify-content:center;gap:10px;height:56px;margin:0 auto}
.logo .bar{display:block;width:12px;height:56px;border-radius:4px;background:linear-gradient(150deg,#7d5417 0%,#c89a3d 42%,#f7d98a 58%,#8a5c1c 100%);box-shadow:0 1px 4px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.3)}
.logo .bar.ruby{background:linear-gradient(150deg,#7a0b2c 0%,#e0115f 45%,#ff4d7d 60%,#a10d3d 100%);box-shadow:0 0 12px rgba(224,17,95,.45),inset 0 1px 0 rgba(255,255,255,.35)}`;

/** Inline ES5: живой тик + опрос API 1с. Без modules/fetch. */
function liveScript(apiUrl: string, initialJson: string): string {
  return `<script>
(function(){
  var meta=document.getElementById('fallbackRefresh');
  if(meta&&meta.parentNode) meta.parentNode.removeChild(meta);
  var API=${JSON.stringify(apiUrl)};
  var state=null;
  var skew=0;
  var lastPaintKey='';
  try{state=${initialJson};}catch(e){state=null;}
  if(state&&state.clock&&state.clock.serverTime){
    var st0=new Date(state.clock.serverTime).getTime();
    if(!isNaN(st0)) skew=st0-Date.now();
  }
  function $(id){return document.getElementById(id);}
  function pad(n){return n<10?'0'+n:''+n;}
  function fmtClock(sec){
    if(sec==null||isNaN(sec)||sec<0) return '\\u2014';
    sec=Math.floor(sec);
    var h=Math.floor(sec/3600), m=Math.floor((sec%3600)/60), s=sec%60;
    return h>0?(h+':'+pad(m)+':'+pad(s)):(m+':'+pad(s));
  }
  function fmtAmt(v){
    if(v==null||v==='') return '\\u2014';
    var n=Number(v);
    if(isNaN(n)) return String(v);
    try{return n.toLocaleString('ru-RU');}catch(e){return String(n);}
  }
  function left(endsAt){
    if(!endsAt) return null;
    var t=new Date(endsAt).getTime();
    if(isNaN(t)) return null;
    var v=Math.round((t-(Date.now()+skew))/1000);
    return v<0?0:v;
  }
  function remainders(c){
    var running=c.status==='RUNNING';
    var levelLeft=null;
    var breakLeft=null;
    if(running){
      levelLeft=left(c.levelEndsAt);
      breakLeft=left(c.breakAt);
    }
    if(levelLeft==null&&c.secondsLeft!=null) levelLeft=c.secondsLeft;
    if(breakLeft==null&&c.secondsToBreak!=null) breakLeft=c.secondsToBreak;
    return {levelLeft:levelLeft,breakLeft:breakLeft,running:running};
  }
  function paint(){
    if(!state||!state.clock){
      var empty=$('empty');
      var board=$('board');
      if(empty) empty.style.display='flex';
      if(board) board.style.display='none';
      lastPaintKey='empty';
      return;
    }
    var c=state.clock;
    var cur=c.current||{};
    var isBreak=!!cur.isBreak;
    var rem=remainders(c);
    var levelLeft=rem.levelLeft;
    var breakLeft=rem.breakLeft;
    var running=rem.running;
    var empty=$('empty');
    var board=$('board');
    if(empty) empty.style.display='none';
    if(board) board.style.display='flex';
    var title=state.tournament&&state.tournament.title?state.tournament.title:'\\u0422\\u0443\\u0440\\u043d\\u0438\\u0440';
    var ev=$('event'); if(ev) ev.innerHTML=title;
    document.title=title;
    var center=$('center');
    if(center){
      if(isBreak){
        center.innerHTML='<div class="break"><div class="lbl">\\u041f\\u0435\\u0440\\u0435\\u0440\\u044b\\u0432</div><div class="big" id="breakClock">'+fmtClock(levelLeft)+'</div></div>';
      } else {
        center.innerHTML='<div class="blinds"><div class="blind"><div class="lbl">\\u041c\\u0430\\u043b\\u044b\\u0439</div><div class="big" id="sb">'+fmtAmt(cur.smallBlind)+'</div></div><div class="sep"></div><div class="blind"><div class="lbl">\\u0411\\u043e\\u043b\\u044c\\u0448\\u043e\\u0439</div><div class="big" id="bb">'+fmtAmt(cur.bigBlind)+'</div></div></div>';
      }
    }
    var nextTxt='';
    if(c.next&&!c.next.isBreak) nextTxt=fmtAmt(c.next.smallBlind)+' / '+fmtAmt(c.next.bigBlind);
    else if(c.next&&c.next.isBreak) nextTxt='\\u041f\\u0435\\u0440\\u0435\\u0440\\u044b\\u0432';
    var nextEl=$('next');
    if(nextEl){
      if(nextTxt&&c.status!=='FINISHED'){ nextEl.style.display='block'; nextEl.innerHTML='\\u0414\\u0430\\u043b\\u0435\\u0435<b>'+nextTxt+'</b>'; }
      else { nextEl.style.display='none'; }
    }
    var lvl=$('levelVal'); if(lvl) lvl.innerHTML=isBreak?'\\u2014':(cur.number!=null?String(cur.number):'\\u2014');
    var lvlLbl=$('levelLeftLbl'); if(lvlLbl) lvlLbl.innerHTML=isBreak?'\\u0414\\u043e \\u043f\\u0440\\u043e\\u0434\\u043e\\u043b\\u0436\\u0435\\u043d\\u0438\\u044f':'\\u0414\\u043e \\u0441\\u043c\\u0435\\u043d\\u044b';
    var lvlLeft=$('levelLeftVal'); if(lvlLeft) lvlLeft.innerHTML=fmtClock(levelLeft);
    var brk=$('breakLeftVal'); if(brk) brk.innerHTML=isBreak?'\\u0418\\u0434\\u0451\\u0442':fmtClock(breakLeft);
    var pl=$('players'); if(pl) pl.innerHTML=c.playersIn!=null?String(c.playersIn):'\\u2014';
    var ante=$('ante'); if(ante) ante.innerHTML=isBreak?'\\u2014':fmtAmt(cur.ante);
    var st='\\u041f\\u0430\\u0443\\u0437\\u0430';
    if(running) st='LIVE';
    else if(c.status==='IDLE') st='\\u0421\\u043a\\u043e\\u0440\\u043e \\u0441\\u0442\\u0430\\u0440\\u0442';
    else if(c.status==='FINISHED') st='\\u0424\\u0438\\u043d\\u0438\\u0448';
    var pill=$('status'); if(pill) pill.innerHTML=st;
    lastPaintKey=String(levelLeft)+'|'+String(breakLeft)+'|'+String(isBreak);
  }
  function tick(){
    if(!state||!state.clock) return;
    var c=state.clock;
    if(c.status!=='RUNNING') return;
    var cur=c.current||{};
    var isBreak=!!cur.isBreak;
    var rem=remainders(c);
    var key=String(rem.levelLeft)+'|'+String(rem.breakLeft)+'|'+String(isBreak);
    if(key===lastPaintKey) return;
    var bc=$('breakClock'); if(bc&&isBreak) bc.innerHTML=fmtClock(rem.levelLeft);
    var ll=$('levelLeftVal'); if(ll) ll.innerHTML=fmtClock(rem.levelLeft);
    var bl=$('breakLeftVal'); if(bl) bl.innerHTML=isBreak?'\\u0418\\u0434\\u0451\\u0442':fmtClock(rem.breakLeft);
    lastPaintKey=key;
  }
  function pull(){
    var x=new XMLHttpRequest();
    x.open('GET',API,true);
    try{x.setRequestHeader('Cache-Control','no-store');}catch(e){}
    x.onreadystatechange=function(){
      if(x.readyState!==4) return;
      if(x.status<200||x.status>=300) return;
      try{
        var payload=JSON.parse(x.responseText);
        var data=payload&&payload.data!==undefined?payload.data:payload;
        state=data;
        if(data&&data.clock&&data.clock.serverTime){
          var st=new Date(data.clock.serverTime).getTime();
          if(!isNaN(st)) skew=st-Date.now();
        }
        paint();
      }catch(err){}
    };
    x.send(null);
  }
  paint();
  setInterval(tick,250);
  setInterval(pull,1000);
  pull();
})();
</script>`;
}

export function renderBoardHtml(board: BoardLike, opts?: { tournamentId?: string }): string {
  const apiPath = opts?.tournamentId
    ? `/api/v1/public/tournaments/${encodeURIComponent(opts.tournamentId)}/board`
    : '/api/v1/public/tournaments/board';

  const initialJson = JSON.stringify(board ?? null)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');

  if (!board?.clock) {
    return `<!doctype html>
<html lang="ru"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta http-equiv="refresh" content="1" id="fallbackRefresh"/>
<title>Табло</title>
<style>
html,body{margin:0;height:100%;background:#090907;color:#f7d98a;font-family:Arial,Helvetica,sans-serif}
.wrap{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:18px}
p{color:#7a6e5a;letter-spacing:.12em;text-transform:uppercase;font-size:22px;margin:0}
.board{display:none}
${LOGO_CSS}
</style></head>
<body>
<div class="wrap" id="empty">${LOGO_MARK}<p>Ближайших турниров нет</p></div>
<div class="board" id="board" style="display:none"></div>
${liveScript(apiPath, initialJson)}
</body></html>`;
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
    ? `<div class="break"><div class="lbl">Перерыв</div><div class="big" id="breakClock">${formatClock(levelLeft)}</div></div>`
    : `<div class="blinds">
        <div class="blind"><div class="lbl">Малый</div><div class="big" id="sb">${formatAmount(current.smallBlind)}</div></div>
        <div class="sep"></div>
        <div class="blind"><div class="lbl">Большой</div><div class="big" id="bb">${formatAmount(current.bigBlind)}</div></div>
      </div>`;

  return `<!doctype html>
<html lang="ru"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta http-equiv="refresh" content="1" id="fallbackRefresh"/>
<title>${title}</title>
<style>
html,body{margin:0;height:100%;background:#090907;color:#f5edd6;font-family:Arial,Helvetica,sans-serif;overflow:hidden}
#empty{display:none;height:100%;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:#f7d98a;gap:18px}
#empty p{color:#7a6e5a;letter-spacing:.12em;text-transform:uppercase;font-size:22px;margin:0}
.board{height:100%;padding:3vh 4vw;box-sizing:border-box;display:flex;flex-direction:column;background:linear-gradient(180deg,#120e09 0%,#090907 45%,#0c0a08 100%)}
.head{text-align:center}
${LOGO_CSS}
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
<div id="empty">${LOGO_MARK}<p>Ближайших турниров нет</p></div>
<div class="board" id="board">
  <header class="head">
    ${LOGO_MARK}
    <div class="rule"></div>
    <div class="event" id="event">${title}</div>
  </header>
  <main class="center" id="center">${center}</main>
  <p class="next" id="next" style="${nextBlinds && clock.status !== 'FINISHED' ? '' : 'display:none'}">${
    nextBlinds && clock.status !== 'FINISHED' ? `Далее<b>${esc(nextBlinds)}</b>` : ''
  }</p>
  <section class="stats">
    <div class="stat"><div class="lbl">Уровень</div><div class="val" id="levelVal">${isBreak ? '—' : current.number != null ? esc(String(current.number)) : '—'}</div></div>
    <div class="stat"><div class="lbl" id="levelLeftLbl">${isBreak ? 'До продолжения' : 'До смены'}</div><div class="val" id="levelLeftVal">${formatClock(levelLeft)}</div></div>
    <div class="stat"><div class="lbl">До перерыва</div><div class="val" id="breakLeftVal">${isBreak ? 'Идёт' : formatClock(breakLeft)}</div></div>
  </section>
  <footer class="foot">
    <span>Играют<b id="players">${clock.playersIn != null ? esc(String(clock.playersIn)) : '—'}</b></span>
    <span class="pill" id="status">${esc(statusText)}</span>
    <span>Ante<b id="ante">${isBreak ? '—' : formatAmount(current.ante)}</b></span>
  </footer>
</div>
${liveScript(apiPath, initialJson)}
</body></html>`;
}
