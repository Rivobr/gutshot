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

/** Фирменный логотип из бота / Mini App. */
const LOGO_MARK = `<img class="brand-logo" src="/gutshot-logo.png" alt="GUTSHOT" width="160" height="160"/>`;

const FONTS_LINK = `<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Sora:wght@400;500;600;700&display=swap" rel="stylesheet"/>`;

const LOGO_CSS = `.brand-logo{display:block;height:clamp(72px,11vh,120px);width:auto;margin:0 auto;object-fit:contain;filter:drop-shadow(0 8px 28px rgba(199,154,61,.22))}
.serif{font-family:'Fraunces',Georgia,'Times New Roman',serif}
.sans{font-family:'Sora',system-ui,Arial,sans-serif}
.fs-btn{position:fixed;right:18px;bottom:18px;z-index:60;border:1px solid rgba(199,154,61,.55);background:rgba(9,9,7,.78);color:#f7d98a;border-radius:999px;padding:10px 16px;font:600 13px/1 'Sora',system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;cursor:pointer}
.fs-btn:hover{background:rgba(199,154,61,.18)}
.fs-hint{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:60;color:rgba(247,217,138,.55);font:500 12px/1 'Sora',system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;pointer-events:none}
body.is-fs .fs-btn,body.is-fs .fs-hint{display:none}`;

/** Inline ES5: живой тик + опрос API. Устойчиво к обрывам (ноут→HDMI). */
function liveScript(apiUrl: string, initialJson: string): string {
  return `<script>
(function(){
  var meta=document.getElementById('fallbackRefresh');
  if(meta&&meta.parentNode) meta.parentNode.removeChild(meta);
  var API=${JSON.stringify(apiUrl)};
  var state=null;
  var skew=0;
  var lastPaintKey='';
  var fails=0;
  var pullTimer=null;
  var wakeLock=null;
  var PULL_OK_MS=1000;
  var PULL_FAIL_MS=3000;
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
  function setOffline(on){
    var banner=$('offline');
    if(!banner) return;
    banner.style.display=on?'block':'none';
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
  function schedulePull(ms){
    if(pullTimer) clearTimeout(pullTimer);
    pullTimer=setTimeout(pull, ms);
  }
  function onPullFail(){
    fails+=1;
    if(fails>=3) setOffline(true);
    schedulePull(PULL_FAIL_MS);
  }
  function pull(){
    var x=new XMLHttpRequest();
    var done=false;
    x.open('GET',API,true);
    try{x.setRequestHeader('Cache-Control','no-store');}catch(e){}
    x.timeout=8000;
    function finishOk(data){
      if(done) return;
      done=true;
      state=data;
      fails=0;
      setOffline(false);
      if(data&&data.clock&&data.clock.serverTime){
        var st=new Date(data.clock.serverTime).getTime();
        if(!isNaN(st)) skew=st-Date.now();
      }
      paint();
      schedulePull(PULL_OK_MS);
    }
    x.onreadystatechange=function(){
      if(x.readyState!==4) return;
      if(x.status<200||x.status>=300){ onPullFail(); return; }
      try{
        var payload=JSON.parse(x.responseText);
        var data=payload&&payload.data!==undefined?payload.data:payload;
        finishOk(data);
      }catch(err){ onPullFail(); }
    };
    x.onerror=function(){ onPullFail(); };
    x.ontimeout=function(){ onPullFail(); };
    try{x.send(null);}catch(err){ onPullFail(); }
  }
  function requestWake(){
    try{
      if(document.visibilityState!=='visible') return;
      if(!navigator.wakeLock||!navigator.wakeLock.request) return;
      navigator.wakeLock.request('screen').then(function(lock){
        wakeLock=lock;
        lock.addEventListener('release',function(){ wakeLock=null; });
      }).catch(function(){});
    }catch(e){}
  }
  function isFs(){
    return !!(document.fullscreenElement||document.webkitFullscreenElement);
  }
  function syncFsUi(){
    if(isFs()) document.body.className=(document.body.className||'').replace(/\\bis-fs\\b/g,'').replace(/\\s+/g,' ').trim()+' is-fs';
    else document.body.className=(document.body.className||'').replace(/\\bis-fs\\b/g,'').replace(/\\s+/g,' ').trim();
    var btn=$('fsBtn');
    if(btn) btn.innerHTML=isFs()?'\\u0412\\u044b\\u0439\\u0442\\u0438':'\\u041d\\u0430 \\u0432\\u0435\\u0441\\u044c \\u044d\\u043a\\u0440\\u0430\\u043d';
  }
  function enterFs(){
    var el=document.documentElement;
    try{
      if(el.requestFullscreen) el.requestFullscreen();
      else if(el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    }catch(e){}
    requestWake();
  }
  function exitFs(){
    try{
      if(document.exitFullscreen) document.exitFullscreen();
      else if(document.webkitExitFullscreen) document.webkitExitFullscreen();
    }catch(e){}
  }
  function toggleFs(){
    if(isFs()) exitFs();
    else enterFs();
  }
  function onVisible(){
    if(document.visibilityState==='visible'){
      requestWake();
      pull();
    }
  }
  paint();
  setInterval(tick,250);
  pull();
  requestWake();
  syncFsUi();
  document.addEventListener('visibilitychange', onVisible);
  document.addEventListener('fullscreenchange', syncFsUi);
  document.addEventListener('webkitfullscreenchange', syncFsUi);
  window.addEventListener('online', function(){ fails=0; pull(); });
  window.addEventListener('focus', function(){ pull(); });
  document.addEventListener('click', function(ev){
    requestWake();
    var t=ev.target;
    if(t&&t.id==='fsBtn'){ toggleFs(); return; }
  });
  document.addEventListener('dblclick', function(ev){
    var t=ev.target;
    if(t&&(t.tagName==='INPUT'||t.tagName==='BUTTON'||t.id==='fsBtn')) return;
    toggleFs();
  });
  document.addEventListener('keydown', function(ev){
    var k=ev.key||'';
    if(k==='f'||k==='F'||k==='\\u0444'||k==='\\u0424'){ ev.preventDefault(); toggleFs(); }
  });
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
${FONTS_LINK}
<style>
html,body{margin:0;height:100%;background:#090907;color:#f7d98a;font-family:'Sora',system-ui,Arial,Helvetica,sans-serif}
.wrap{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:18px}
p{color:#7a6e5a;letter-spacing:.12em;text-transform:uppercase;font-size:22px;margin:0;font-family:'Sora',system-ui,sans-serif}
.board{display:none}
.offline{display:none;position:fixed;top:0;left:0;right:0;z-index:50;background:rgba(120,20,40,.92);color:#fff;text-align:center;padding:10px 16px;font-size:14px;letter-spacing:.08em;text-transform:uppercase;font-family:'Sora',system-ui,sans-serif}
${LOGO_CSS}
</style></head>
<body>
<div class="offline" id="offline">нет связи — табло держит последние данные, переподключение…</div>
<div class="wrap" id="empty">${LOGO_MARK}<p>Ближайших турниров нет</p></div>
<div class="board" id="board" style="display:none"></div>
<button type="button" class="fs-btn" id="fsBtn">На весь экран</button>
<div class="fs-hint">F11 или F · двойной клик</div>
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
${FONTS_LINK}
<style>
html,body{margin:0;height:100%;background:#090907;color:#f5edd6;font-family:'Sora',system-ui,Arial,Helvetica,sans-serif;overflow:hidden}
#empty{display:none;height:100%;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:#f7d98a;gap:18px}
#empty p{color:#7a6e5a;letter-spacing:.12em;text-transform:uppercase;font-size:22px;margin:0;font-family:'Sora',system-ui,sans-serif}
.offline{display:none;position:fixed;top:0;left:0;right:0;z-index:50;background:rgba(120,20,40,.92);color:#fff;text-align:center;padding:10px 16px;font-size:14px;letter-spacing:.08em;text-transform:uppercase;font-family:'Sora',system-ui,sans-serif}
.board{height:100%;padding:3vh 4vw;box-sizing:border-box;display:flex;flex-direction:column;background:linear-gradient(180deg,#120e09 0%,#090907 45%,#0c0a08 100%)}
.head{text-align:center}
${LOGO_CSS}
.rule{width:40%;max-width:520px;height:1px;margin:1.2vh auto;background:#c89a3d}
.event{font-family:'Sora',system-ui,sans-serif;font-size:16px;letter-spacing:.24em;text-transform:uppercase;color:#f7d98a;opacity:.85;font-weight:600}
.center{flex:1;display:flex;align-items:center;justify-content:center;min-height:0}
.blinds{display:flex;align-items:center;justify-content:center}
.blind{text-align:center;margin:0 36px}
.lbl{font-family:'Sora',system-ui,sans-serif;font-size:16px;letter-spacing:.26em;text-transform:uppercase;color:#c89a3d;font-weight:700}
.big{font-family:'Fraunces',Georgia,'Times New Roman',serif;font-weight:700;font-size:120px;line-height:.95;color:#fff8e6;margin-top:8px}
.sep{width:2px;height:120px;background:#c89a3d}
.break{text-align:center}
.next{text-align:center;color:#7a6e5a;letter-spacing:.18em;text-transform:uppercase;font-size:16px;margin:0 0 1vh;font-family:'Sora',system-ui,sans-serif}
.next b{color:#f7d98a;margin-left:.5em;font-family:'Fraunces',Georgia,serif}
.stats{display:flex;border-top:1px solid rgba(199,154,61,.22);padding:2vh 0 1.5vh}
.stat{flex:1;text-align:center}
.stat .lbl{font-size:14px}
.stat .val{font-family:'Fraunces',Georgia,serif;font-size:48px;font-weight:700;margin-top:6px;color:#f5edd6}
.foot{display:flex;justify-content:space-between;align-items:center;padding-top:1vh;color:#7a6e5a;letter-spacing:.16em;text-transform:uppercase;font-size:16px;font-weight:700;font-family:'Sora',system-ui,sans-serif}
.foot b{color:#f5edd6;margin-left:.45em;font-family:'Fraunces',Georgia,serif}
.pill{border:1px solid rgba(199,154,61,.5);background:rgba(199,154,61,.12);color:#f7d98a;border-radius:999px;padding:.4em 1em;font-family:'Sora',system-ui,sans-serif}
</style></head>
<body>
<div class="offline" id="offline">нет связи — табло держит последние данные, переподключение…</div>
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
<button type="button" class="fs-btn" id="fsBtn">На весь экран</button>
<div class="fs-hint">F11 или F · двойной клик</div>
${liveScript(apiPath, initialJson)}
</body></html>`;
}
