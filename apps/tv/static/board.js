/* ES5 / XHR — для Xiaomi YaBrowser Lite TV (без React / modules / fetch). */
/* eslint-env browser */
/* eslint-disable no-empty */
(function () {
  var POLL_OK_MS = 2000;
  var POLL_FAIL_MS = 3000;
  var root = document.getElementById('root');
  var board = null;
  var skewMs = 0;
  var failures = 0;
  var pullTimer = null;
  var wakeLock = null;

  function qs(name) {
    var m = window.location.search.match(new RegExp('[?&]' + name + '=([^&]*)'));
    return m ? decodeURIComponent(m[1]) : null;
  }

  function boardUrl() {
    var id = qs('tournament');
    if (id) return '/api/v1/public/tournaments/' + id + '/board';
    return '/api/v1/public/tournaments/board';
  }

  function pad2(n) {
    return (n < 10 ? '0' : '') + n;
  }

  function formatClock(totalSec) {
    if (totalSec == null || isNaN(totalSec) || totalSec < 0) return '—';
    totalSec = Math.floor(totalSec);
    var h = Math.floor(totalSec / 3600);
    var m = Math.floor((totalSec % 3600) / 60);
    var s = totalSec % 60;
    if (h > 0) return h + ':' + pad2(m) + ':' + pad2(s);
    return m + ':' + pad2(s);
  }

  function formatAmount(value) {
    if (value == null || value === '') return '—';
    var n = Number(value);
    if (isNaN(n)) return String(value);
    try {
      return n.toLocaleString('ru-RU');
    } catch (e) {
      return String(n);
    }
  }

  function secondsLeft(endsAt, running) {
    if (!endsAt) return null;
    var target = new Date(endsAt).getTime();
    if (isNaN(target)) return null;
    var now = Date.now() + skewMs;
    var left = Math.round((target - now) / 1000);
    if (!running && left < 0) left = 0;
    return left < 0 ? 0 : left;
  }

  function xhrGet(url, cb) {
    var x = new XMLHttpRequest();
    var done = false;
    x.open('GET', url, true);
    try {
      x.setRequestHeader('Cache-Control', 'no-store');
    } catch (e) {}
    x.timeout = 8000;
    function finish(err, data) {
      if (done) return;
      done = true;
      cb(err, data);
    }
    x.onreadystatechange = function () {
      if (x.readyState !== 4) return;
      if (x.status >= 200 && x.status < 300) {
        try {
          finish(null, JSON.parse(x.responseText));
        } catch (err) {
          finish(err);
        }
      } else {
        finish(new Error('http ' + x.status));
      }
    };
    x.onerror = function () {
      finish(new Error('network'));
    };
    x.ontimeout = function () {
      finish(new Error('timeout'));
    };
    try {
      x.send(null);
    } catch (err) {
      finish(err);
    }
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.appendChild(document.createTextNode(text));
    return node;
  }

  function logoMark() {
    var logo = el('div', 'logo');
    for (var i = 0; i < 5; i++) {
      logo.appendChild(el('span', i === 2 ? 'bar ruby' : 'bar'));
    }
    return logo;
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function ensureOfflineBanner(on) {
    var banner = document.getElementById('offline-banner');
    if (!on) {
      if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
      return;
    }
    if (banner) return;
    banner = el('div', 'offline', 'нет связи — табло держит последние данные, переподключение…');
    banner.id = 'offline-banner';
    document.body.insertBefore(banner, document.body.firstChild);
  }

  function renderNotice(text) {
    clear(root);
    var wrap = el('div', 'board');
    var notice = el('div', 'notice');
    notice.appendChild(logoMark());
    notice.appendChild(el('div', 'rule'));
    notice.appendChild(el('p', 'notice-text', text));
    wrap.appendChild(notice);
    root.appendChild(wrap);
  }

  function renderBoard() {
    if (!board || !board.clock) {
      renderNotice('Ближайших турниров нет');
      return;
    }

    var clock = board.clock;
    var current = clock.current || {};
    var running = clock.status === 'RUNNING';
    var isBreak = !!current.isBreak;
    var notStarted = clock.status === 'IDLE';
    var finished = clock.status === 'FINISHED';
    var levelLeft = secondsLeft(clock.levelEndsAt, running);
    if (levelLeft == null && clock.secondsLeft != null) levelLeft = clock.secondsLeft;
    var breakLeft = secondsLeft(clock.breakAt, running);
    if (breakLeft == null && clock.secondsToBreak != null) breakLeft = clock.secondsToBreak;

    clear(root);
    var wrap = el('div', 'board');

    var head = el('header', 'head');
    head.appendChild(logoMark());
    head.appendChild(el('div', 'rule'));
    var title = board.tournament && board.tournament.title ? board.tournament.title : 'Турнир';
    head.appendChild(el('div', 'event', title));
    wrap.appendChild(head);

    var center = el('main', 'center');
    if (isBreak) {
      var br = el('div', 'break');
      br.appendChild(el('div', 'lbl', 'Перерыв'));
      br.appendChild(el('div', 'big', formatClock(levelLeft)));
      center.appendChild(br);
    } else {
      var blinds = el('div', 'blinds');
      var sb = el('div', 'blind');
      sb.appendChild(el('div', 'lbl', 'Малый'));
      sb.appendChild(el('div', 'big', formatAmount(current.smallBlind)));
      var sep = el('div', 'sep');
      var bb = el('div', 'blind');
      bb.appendChild(el('div', 'lbl', 'Большой'));
      bb.appendChild(el('div', 'big', formatAmount(current.bigBlind)));
      blinds.appendChild(sb);
      blinds.appendChild(sep);
      blinds.appendChild(bb);
      center.appendChild(blinds);
    }
    wrap.appendChild(center);

    var nextTxt = '';
    if (clock.next && !clock.next.isBreak) {
      nextTxt = formatAmount(clock.next.smallBlind) + ' / ' + formatAmount(clock.next.bigBlind);
    } else if (clock.next && clock.next.isBreak) {
      nextTxt = 'Перерыв';
    }
    if (nextTxt && clock.status !== 'FINISHED') {
      var next = el('p', 'next', 'Далее');
      var nb = document.createElement('b');
      nb.appendChild(document.createTextNode(nextTxt));
      next.appendChild(nb);
      wrap.appendChild(next);
    }

    var stats = el('section', 'stats');
    function addStat(label, value) {
      var s = el('div', 'stat');
      s.appendChild(el('div', 'lbl', label));
      s.appendChild(el('div', 'val', value));
      stats.appendChild(s);
    }
    addStat('Уровень', isBreak ? '—' : current.number != null ? String(current.number) : '—');
    addStat(isBreak ? 'До продолжения' : 'До смены', formatClock(levelLeft));
    addStat('До перерыва', isBreak ? 'Идёт' : formatClock(breakLeft));
    wrap.appendChild(stats);

    var foot = el('footer', 'foot');
    var f1 = el('span', 'foot-item', 'Играют');
    var f1b = document.createElement('b');
    f1b.appendChild(
      document.createTextNode(clock.playersIn != null ? String(clock.playersIn) : '—'),
    );
    f1.appendChild(f1b);

    var statusText = 'Пауза';
    if (running) statusText = 'Live';
    else if (notStarted) statusText = 'Скоро старт';
    else if (finished) statusText = 'Финиш';
    var pill = el('span', 'pill');
    var dot = el('span', running ? 'dot' : 'dot idle');
    pill.appendChild(dot);
    pill.appendChild(document.createTextNode(statusText));

    var f3 = el('span', 'foot-item', 'Ante');
    var f3b = document.createElement('b');
    f3b.appendChild(document.createTextNode(isBreak ? '—' : formatAmount(current.ante)));
    f3.appendChild(f3b);

    foot.appendChild(f1);
    foot.appendChild(pill);
    foot.appendChild(f3);
    wrap.appendChild(foot);

    root.appendChild(wrap);
  }

  function schedule(ms) {
    if (pullTimer) clearTimeout(pullTimer);
    pullTimer = setTimeout(load, ms);
  }

  function load() {
    xhrGet(boardUrl(), function (err, payload) {
      if (err) {
        failures += 1;
        ensureOfflineBanner(failures >= 3);
        if (!board) renderNotice('Нет связи… повтор ' + failures);
        else renderBoard();
        schedule(POLL_FAIL_MS);
        return;
      }
      failures = 0;
      ensureOfflineBanner(false);
      var data = payload && payload.data ? payload.data : null;
      if (data && data.clock) {
        board = data;
        if (data.clock.serverTime) {
          var server = new Date(data.clock.serverTime).getTime();
          if (!isNaN(server)) skewMs = server - Date.now();
        }
      } else if (!board) {
        board = data;
      }
      renderBoard();
      schedule(POLL_OK_MS);
    });
  }

  function requestWake() {
    try {
      if (document.visibilityState !== 'visible') return;
      if (!navigator.wakeLock || !navigator.wakeLock.request) return;
      navigator.wakeLock
        .request('screen')
        .then(function (lock) {
          wakeLock = lock;
        })
        .catch(function () {});
    } catch (e) {}
  }

  function onVisible() {
    if (document.visibilityState === 'visible') {
      requestWake();
      load();
    }
  }

  renderNotice('Загрузка табло…');
  requestWake();
  load();
  setInterval(function () {
    if (board) renderBoard();
  }, 1000);
  document.addEventListener('visibilitychange', onVisible);
  window.addEventListener('online', function () {
    failures = 0;
    load();
  });
  window.addEventListener('focus', load);
  document.addEventListener('click', requestWake);
})();
