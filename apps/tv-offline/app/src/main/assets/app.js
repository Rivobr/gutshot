/* eslint-env browser */
(function () {
  'use strict';

  /** Клубный шаблон: до late reg как раньше; после — плавный рост, короткие часы. */
  var STRUCTURE = [
    { isBreak: false, level: 1, sb: 100, bb: 100, ante: 100, minutes: 12 },
    { isBreak: false, level: 2, sb: 100, bb: 200, ante: 200, minutes: 12 },
    { isBreak: false, level: 3, sb: 200, bb: 400, ante: 400, minutes: 15 },
    { isBreak: false, level: 4, sb: 300, bb: 600, ante: 600, minutes: 20 },
    { isBreak: true, minutes: 10 },
    { isBreak: false, level: 5, sb: 400, bb: 800, ante: 800, minutes: 25 },
    { isBreak: false, level: 6, sb: 500, bb: 1000, ante: 1000, minutes: 30 },
    { isBreak: false, level: 7, sb: 600, bb: 1200, ante: 1200, minutes: 20 },
    { isBreak: true, minutes: 10 },
    { isBreak: false, level: 8, sb: 800, bb: 1600, ante: 1600, minutes: 23 },
    { isBreak: false, level: 9, sb: 1000, bb: 2000, ante: 2000, minutes: 23 },
    { isBreak: false, level: 10, sb: 1500, bb: 3000, ante: 3000, minutes: 20 },
    { isBreak: true, minutes: 15 }, // конец поздней регистрации
    { isBreak: false, level: 11, sb: 2000, bb: 4000, ante: 4000, minutes: 12 },
    { isBreak: false, level: 12, sb: 2500, bb: 5000, ante: 5000, minutes: 8 },
    { isBreak: false, level: 13, sb: 3000, bb: 6000, ante: 6000, minutes: 8 },
    { isBreak: false, level: 14, sb: 4000, bb: 8000, ante: 8000, minutes: 8 },
    { isBreak: false, level: 15, sb: 5000, bb: 10000, ante: 10000, minutes: 8 },
    { isBreak: false, level: 16, sb: 6000, bb: 12000, ante: 12000, minutes: 8 },
    { isBreak: false, level: 17, sb: 8000, bb: 16000, ante: 16000, minutes: 6 },
    { isBreak: false, level: 18, sb: 10000, bb: 20000, ante: 20000, minutes: 6 },
    { isBreak: false, level: 19, sb: 12500, bb: 25000, ante: 25000, minutes: 6 },
    { isBreak: false, level: 20, sb: 15000, bb: 30000, ante: 30000, minutes: 6 },
    { isBreak: false, level: 21, sb: 20000, bb: 40000, ante: 40000, minutes: 6 },
    { isBreak: false, level: 22, sb: 25000, bb: 50000, ante: 50000, minutes: 6 },
    { isBreak: false, level: 23, sb: 30000, bb: 60000, ante: 60000, minutes: 6 },
    { isBreak: false, level: 24, sb: 40000, bb: 80000, ante: 80000, minutes: 6 },
    { isBreak: false, level: 25, sb: 50000, bb: 100000, ante: 100000, minutes: 6 },
    { isBreak: false, level: 26, sb: 75000, bb: 150000, ante: 150000, minutes: 6 },
    { isBreak: false, level: 27, sb: 100000, bb: 200000, ante: 200000, minutes: 6 },
    { isBreak: false, level: 28, sb: 150000, bb: 300000, ante: 300000, minutes: 6 },
    { isBreak: false, level: 29, sb: 200000, bb: 400000, ante: 400000, minutes: 6 },
  ];

  var STORAGE_KEY = 'gutshot.tv.offline.v4';

  var state = {
    mode: 'menu', // menu | waiting | running | finished
    startHour: 18,
    startMinute: 0,
    startAtMs: null,
    idx: 0,
    segmentStartedAtMs: null,
    paused: false,
    pauseStartedAtMs: null,
  };

  var menuConfirmUntil = 0;
  var menuConfirmTimer = null;

  function $(id) {
    return document.getElementById(id);
  }

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function fmtAmt(v) {
    try {
      return Number(v).toLocaleString('ru-RU');
    } catch (e) {
      return String(v);
    }
  }

  /** Mark digit length so CSS can shrink late-level amounts (200 000 etc.). */
  function setDigits(el, formatted) {
    if (!el) return;
    var digits = String(formatted || '').replace(/\D/g, '').length;
    if (digits < 1) digits = 1;
    if (digits > 8) digits = 8;
    el.setAttribute('data-digits', String(digits));
  }

  function setAmt(el, value) {
    var formatted = fmtAmt(value);
    el.textContent = formatted;
    setDigits(el, formatted);
  }

  function fmtClock(totalSec) {
    if (totalSec == null || isNaN(totalSec) || totalSec < 0) return '—';
    totalSec = Math.floor(totalSec);
    var h = Math.floor(totalSec / 3600);
    var m = Math.floor((totalSec % 3600) / 60);
    var s = totalSec % 60;
    return h > 0 ? h + ':' + pad(m) + ':' + pad(s) : pad(m) + ':' + pad(s);
  }

  /** Текущее время в Europe/Moscow. */
  function nowMoscow() {
    var parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Moscow',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date());
    var map = {};
    parts.forEach(function (p) {
      if (p.type !== 'literal') map[p.type] = p.value;
    });
    return {
      year: +map.year,
      month: +map.month,
      day: +map.day,
      hour: +map.hour,
      minute: +map.minute,
      second: +map.second,
    };
  }

  /** MSK wall time → epoch ms (через форматирование offset). */
  function mskWallToUtcMs(y, mo, d, h, mi, s) {
    s = s || 0;
    // Строим как если бы это был UTC, затем корректируем на реальный MSK offset.
    var asUtc = Date.UTC(y, mo - 1, d, h, mi, s);
    var probe = new Date(asUtc);
    var fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Moscow',
      timeZoneName: 'shortOffset',
      hour: '2-digit',
    });
    var tzName = fmt.formatToParts(probe).find(function (p) {
      return p.type === 'timeZoneName';
    });
    var offsetMin = 180; // default MSK
    if (tzName && tzName.value) {
      var m = tzName.value.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/);
      if (m) {
        offsetMin = (m[1] === '-' ? -1 : 1) * (+m[2] * 60 + +(m[3] || 0));
      }
    }
    return asUtc - offsetMin * 60 * 1000;
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // ignore quota / private mode
    }
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return;
      state.mode = parsed.mode || 'menu';
      state.startHour = parsed.startHour != null ? parsed.startHour : 18;
      state.startMinute = parsed.startMinute != null ? parsed.startMinute : 0;
      state.startAtMs = parsed.startAtMs || null;
      state.idx = parsed.idx || 0;
      state.segmentStartedAtMs = parsed.segmentStartedAtMs || null;
      state.paused = !!parsed.paused;
      state.pauseStartedAtMs = parsed.pauseStartedAtMs || null;
    } catch (e) {
      // ignore corrupt storage
    }
  }

  function clockNow() {
    if (state.paused && state.pauseStartedAtMs != null) return state.pauseStartedAtMs;
    return Date.now();
  }

  function setPausedUi(on) {
    var badge = $('pauseBadge');
    if (badge) badge.classList.toggle('hidden', !on);
  }

  function setConfirmUi(on) {
    var hint = $('confirmHint');
    if (hint) hint.classList.toggle('hidden', !on);
  }

  function clearMenuConfirm() {
    menuConfirmUntil = 0;
    if (menuConfirmTimer) {
      clearTimeout(menuConfirmTimer);
      menuConfirmTimer = null;
    }
    setConfirmUi(false);
  }

  function requestMenuConfirm() {
    var now = Date.now();
    if (now < menuConfirmUntil) {
      clearMenuConfirm();
      resetToMenu();
      return;
    }
    menuConfirmUntil = now + 3000;
    setConfirmUi(true);
    if (menuConfirmTimer) clearTimeout(menuConfirmTimer);
    menuConfirmTimer = setTimeout(function () {
      clearMenuConfirm();
    }, 3000);
  }

  function togglePause() {
    if (state.mode !== 'running') return;
    if (state.paused) {
      var pauseDur = Date.now() - (state.pauseStartedAtMs || Date.now());
      if (state.segmentStartedAtMs != null) {
        state.segmentStartedAtMs += pauseDur;
      }
      state.paused = false;
      state.pauseStartedAtMs = null;
    } else {
      state.paused = true;
      state.pauseStartedAtMs = Date.now();
    }
    save();
    setPausedUi(state.paused);
    tick();
  }

  function jumpSegment(delta) {
    if (state.mode !== 'running') return;
    var next = state.idx + delta;
    if (next < 0 || next >= STRUCTURE.length) {
      if (next >= STRUCTURE.length) {
        state.mode = 'finished';
        state.paused = false;
        state.pauseStartedAtMs = null;
        state.segmentStartedAtMs = null;
        setPausedUi(false);
        save();
        renderFinish();
      }
      return;
    }
    // Если на паузе — снимаем, чтобы новый уровень шёл сразу.
    state.paused = false;
    state.pauseStartedAtMs = null;
    setPausedUi(false);
    state.idx = next;
    state.segmentStartedAtMs = Date.now();
    save();
    tick();
  }

  function startNow() {
    var now = Date.now();
    state.mode = 'running';
    state.idx = 0;
    state.startAtMs = now;
    state.segmentStartedAtMs = now;
    state.paused = false;
    state.pauseStartedAtMs = null;
    setPausedUi(false);
    clearMenuConfirm();
    save();
    tick();
  }

  function show(mode) {
    ['menu', 'waiting', 'play', 'break', 'finish'].forEach(function (id) {
      var el = $(id + 'Screen');
      if (el) el.classList.toggle('hidden', id !== mode);
    });
  }

  function nextPlayableAfter(idx) {
    for (var i = idx + 1; i < STRUCTURE.length; i++) {
      if (!STRUCTURE[i].isBreak) return STRUCTURE[i];
    }
    return null;
  }

  function secondsToNextBreak(fromIdx, elapsedInSegment) {
    var cur = STRUCTURE[fromIdx];
    if (!cur) return 0;
    if (cur.isBreak) return 0;
    var left = Math.max(0, cur.minutes * 60 - elapsedInSegment);
    for (var i = fromIdx + 1; i < STRUCTURE.length; i++) {
      if (STRUCTURE[i].isBreak) return left;
      left += STRUCTURE[i].minutes * 60;
    }
    return left;
  }

  function syncSegments(nowMs) {
    if (state.mode !== 'running' || state.segmentStartedAtMs == null || state.paused) return;
    while (state.idx < STRUCTURE.length) {
      var seg = STRUCTURE[state.idx];
      var dur = seg.minutes * 60 * 1000;
      var ends = state.segmentStartedAtMs + dur;
      if (nowMs < ends) break;
      state.idx += 1;
      state.segmentStartedAtMs = ends;
    }
    if (state.idx >= STRUCTURE.length) {
      state.mode = 'finished';
      state.segmentStartedAtMs = null;
      save();
    }
  }

  /** Выбранное время уже прошло сегодня по MSK? → старт сразу сегодня. */
  function planIsPastToday() {
    var msk = nowMoscow();
    var startMs = mskWallToUtcMs(
      msk.year,
      msk.month,
      msk.day,
      state.startHour,
      state.startMinute,
      0,
    );
    return startMs <= Date.now() + 5000;
  }

  function formatWaitMeta(leftSec) {
    if (leftSec <= 0) return 'старт…';
    var h = Math.floor(leftSec / 3600);
    var m = Math.ceil((leftSec % 3600) / 60);
    if (m === 60) {
      h += 1;
      m = 0;
    }
    var remain;
    if (h <= 0) {
      remain = 'через ' + Math.max(1, Math.ceil(leftSec / 60)) + ' мин';
    } else if (m === 0) {
      remain = 'через ' + h + ' ч';
    } else {
      remain = 'через ' + h + ' ч ' + m + ' мин';
    }
    return remain + ' · MSK';
  }

  function renderMenu() {
    show('menu');
    $('planTime').textContent = pad(state.startHour) + ':' + pad(state.startMinute);
    var dayEl = $('planDay');
    if (dayEl) {
      dayEl.textContent = planIsPastToday()
        ? 'время прошло · старт сразу сегодня'
        : 'старт сегодня';
    }
  }

  function renderWaiting(nowMs) {
    show('waiting');
    $('waitTime').textContent = pad(state.startHour) + ':' + pad(state.startMinute);
    var leftSec = Math.max(0, Math.ceil((state.startAtMs - nowMs) / 1000));
    $('waitMeta').textContent = formatWaitMeta(leftSec);
  }

  function renderPlayOrBreak(nowMs) {
    var seg = STRUCTURE[state.idx];
    if (!seg) {
      state.mode = 'finished';
      save();
      renderFinish();
      return;
    }
    var elapsed = Math.max(0, Math.floor((nowMs - state.segmentStartedAtMs) / 1000));
    var left = Math.max(0, seg.minutes * 60 - elapsed);

    if (seg.isBreak) {
      show('break');
      $('breakClock').textContent = fmtClock(left);
      setDigits($('breakClock'), $('breakClock').textContent);
      var next = nextPlayableAfter(state.idx);
      if (next) {
        $('breakLevel').textContent = String(next.level);
        var breakBlinds = fmtAmt(next.sb) + ' / ' + fmtAmt(next.bb);
        $('breakBlinds').textContent = breakBlinds;
        setDigits($('breakBlinds'), String(next.sb) + String(next.bb));
      } else {
        $('breakLevel').textContent = '—';
        $('breakBlinds').textContent = '—';
        setDigits($('breakBlinds'), '0');
      }
      return;
    }

    show('play');
    setAmt($('sb'), seg.sb);
    setAmt($('bb'), seg.bb);
    setAmt($('ante'), seg.ante);
    $('levelVal').textContent = String(seg.level);
    $('levelLeftVal').textContent = fmtClock(left);
    $('breakLeftVal').textContent = fmtClock(secondsToNextBreak(state.idx, elapsed));

    var upcoming = nextPlayableAfter(state.idx);
    var nextEl = $('nextLine');
    if (upcoming) {
      nextEl.classList.remove('hidden');
      nextEl.innerHTML = 'Далее<b>' + fmtAmt(upcoming.sb) + ' / ' + fmtAmt(upcoming.bb) + '</b>';
    } else if (STRUCTURE[state.idx + 1] && STRUCTURE[state.idx + 1].isBreak) {
      nextEl.classList.remove('hidden');
      nextEl.innerHTML = 'Далее<b>Перерыв</b>';
    } else {
      nextEl.classList.add('hidden');
    }
  }

  function renderFinish() {
    show('finish');
  }

  function tick() {
    var wallNow = Date.now();
    var nowMs = clockNow();

    if (state.mode === 'waiting' && state.startAtMs != null) {
      if (wallNow >= state.startAtMs) {
        state.mode = 'running';
        state.idx = 0;
        state.segmentStartedAtMs = state.startAtMs;
        state.paused = false;
        state.pauseStartedAtMs = null;
        setPausedUi(false);
        save();
      } else {
        setPausedUi(false);
        renderWaiting(wallNow);
        return;
      }
    }

    if (state.mode === 'running') {
      syncSegments(nowMs);
      if (state.mode === 'finished') {
        setPausedUi(false);
        renderFinish();
        return;
      }
      setPausedUi(!!state.paused);
      renderPlayOrBreak(nowMs);
      return;
    }

    if (state.mode === 'finished') {
      setPausedUi(false);
      renderFinish();
      return;
    }

    setPausedUi(false);
    renderMenu();
  }

  function adjustTime(deltaMin) {
    var total = state.startHour * 60 + state.startMinute + deltaMin;
    total = ((total % 1440) + 1440) % 1440;
    state.startHour = Math.floor(total / 60);
    state.startMinute = total % 60;
    save();
    renderMenu();
  }

  function schedule() {
    var msk = nowMoscow();
    var startMs = mskWallToUtcMs(
      msk.year,
      msk.month,
      msk.day,
      state.startHour,
      state.startMinute,
      0,
    );
    // Только сегодня: если время уже прошло — старт сразу.
    if (startMs <= Date.now() + 5000) {
      startNow();
      return;
    }
    state.startAtMs = startMs;
    state.mode = 'waiting';
    state.idx = 0;
    state.segmentStartedAtMs = null;
    state.paused = false;
    state.pauseStartedAtMs = null;
    clearMenuConfirm();
    setPausedUi(false);
    save();
    tick();
  }

  function resetToMenu() {
    state.mode = 'menu';
    state.startAtMs = null;
    state.idx = 0;
    state.segmentStartedAtMs = null;
    state.paused = false;
    state.pauseStartedAtMs = null;
    clearMenuConfirm();
    setPausedUi(false);
    save();
    renderMenu();
  }

  function onKey(e) {
    var key = e.key;
    var isBack = key === 'Escape' || key === 'Backspace' || key === 'BrowserBack';
    var isOk = key === 'Enter' || key === ' ' || key === 'MediaPlayPause';

    if (state.mode === 'menu') {
      if (key === 'ArrowUp') {
        e.preventDefault();
        adjustTime(15);
      } else if (key === 'ArrowDown') {
        e.preventDefault();
        adjustTime(-15);
      } else if (key === 'ArrowLeft') {
        e.preventDefault();
        adjustTime(-1);
      } else if (key === 'ArrowRight') {
        e.preventDefault();
        adjustTime(1);
      } else if (isOk) {
        e.preventDefault();
        schedule();
      }
      return;
    }

    if (state.mode === 'finished') {
      if (isOk || isBack) {
        e.preventDefault();
        resetToMenu();
      }
      return;
    }

    // waiting / running
    if (isBack) {
      e.preventDefault();
      requestMenuConfirm();
      return;
    }

    if (state.mode === 'waiting') {
      if (isOk) {
        e.preventDefault();
        startNow();
      }
      return;
    }

    if (state.mode === 'running') {
      if (isOk) {
        e.preventDefault();
        clearMenuConfirm();
        togglePause();
      } else if (key === 'ArrowRight') {
        e.preventDefault();
        clearMenuConfirm();
        jumpSegment(1);
      } else if (key === 'ArrowLeft') {
        e.preventDefault();
        clearMenuConfirm();
        jumpSegment(-1);
      }
    }
  }

  function bind() {
    var up = $('btnUp');
    var down = $('btnDown');
    var plan = $('btnPlan');
    var menu = $('btnMenu');
    if (up)
      up.onclick = function () {
        adjustTime(15);
      };
    if (down)
      down.onclick = function () {
        adjustTime(-15);
      };
    if (plan) plan.onclick = schedule;
    if (menu) menu.onclick = resetToMenu;
    window.addEventListener('keydown', onKey);
  }

  load();
  // Если waiting, но start уже прошёл давно — сразу в running через tick.
  bind();
  tick();
  setInterval(tick, 250);
})();
