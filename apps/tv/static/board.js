/* ES5 / XHR — для Xiaomi YaBrowser Lite TV (без React / modules / fetch). */
/* eslint-env browser */
/* eslint-disable no-empty */
(function () {
  var POLL_MS = 10000;
  var root = document.getElementById('root');
  var board = null;
  var skewMs = 0;
  var failures = 0;

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
    x.open('GET', url, true);
    try {
      x.setRequestHeader('Cache-Control', 'no-store');
    } catch (e) {}
    x.onreadystatechange = function () {
      if (x.readyState !== 4) return;
      if (x.status >= 200 && x.status < 300) {
        try {
          cb(null, JSON.parse(x.responseText));
        } catch (err) {
          cb(err);
        }
      } else {
        cb(new Error('http ' + x.status));
      }
    };
    x.onerror = function () {
      cb(new Error('network'));
    };
    x.send(null);
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.appendChild(document.createTextNode(text));
    return node;
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function renderNotice(text) {
    clear(root);
    var wrap = el('div', 'board');
    var notice = el('div', 'notice');
    notice.appendChild(el('div', 'wordmark', 'GUTSHOT'));
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

    var nextBlinds = null;
    if (clock.next && !clock.next.isBreak) {
      nextBlinds = formatAmount(clock.next.smallBlind) + ' / ' + formatAmount(clock.next.bigBlind);
    } else if (clock.next && clock.next.isBreak) {
      nextBlinds = 'Перерыв';
    }

    clear(root);
    var wrap = el('div', 'board');

    if (failures >= 3) {
      wrap.appendChild(el('div', 'offline', 'нет связи с сервером'));
    }

    var head = el('header', 'head');
    head.appendChild(el('div', 'wordmark', 'GUTSHOT'));
    head.appendChild(el('div', 'rule'));
    head.appendChild(el('div', 'event', board.tournament ? board.tournament.title : ''));
    wrap.appendChild(head);

    var main = el('main', 'center');
    if (isBreak) {
      var br = el('div', 'break-banner');
      br.appendChild(el('div', 'blind-label', 'Перерыв'));
      br.appendChild(el('div', 'break-title', formatClock(levelLeft)));
      main.appendChild(br);
    } else {
      var b1 = el('div', 'blind');
      b1.appendChild(el('div', 'blind-label', 'Малый'));
      b1.appendChild(el('div', 'blind-value', formatAmount(current.smallBlind)));
      var div = el('div', 'divider');
      var b2 = el('div', 'blind');
      b2.appendChild(el('div', 'blind-label', 'Большой'));
      b2.appendChild(el('div', 'blind-value', formatAmount(current.bigBlind)));
      main.appendChild(b1);
      main.appendChild(div);
      main.appendChild(b2);
    }
    wrap.appendChild(main);

    if (nextBlinds && !finished) {
      var next = el('p', 'next-level', 'Далее');
      var nb = document.createElement('b');
      nb.appendChild(document.createTextNode(nextBlinds));
      next.appendChild(nb);
      wrap.appendChild(next);
    }

    var stats = el('section', 'stats');
    var s1 = el('div', 'stat');
    s1.appendChild(el('div', 'stat-label', 'Уровень'));
    s1.appendChild(
      el(
        'div',
        'stat-value',
        isBreak ? '—' : current.number != null ? String(current.number) : '—',
      ),
    );
    var s2 = el('div', 'stat');
    s2.appendChild(el('div', 'stat-label', isBreak ? 'До продолжения' : 'До смены'));
    var levelClass = 'stat-value';
    if (running && levelLeft != null && levelLeft <= 60) levelClass += ' warn';
    s2.appendChild(el('div', levelClass, formatClock(levelLeft)));
    var s3 = el('div', 'stat');
    s3.appendChild(el('div', 'stat-label', 'До перерыва'));
    s3.appendChild(el('div', 'stat-value', isBreak ? 'Идёт' : formatClock(breakLeft)));
    stats.appendChild(s1);
    stats.appendChild(s2);
    stats.appendChild(s3);
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

  function load() {
    xhrGet(boardUrl(), function (err, payload) {
      if (err) {
        failures += 1;
        if (!board) renderNotice('Нет связи… повтор ' + failures);
        else renderBoard();
        return;
      }
      failures = 0;
      var data = payload && payload.data ? payload.data : null;
      board = data;
      if (data && data.clock && data.clock.serverTime) {
        var server = new Date(data.clock.serverTime).getTime();
        if (!isNaN(server)) skewMs = server - Date.now();
      }
      renderBoard();
    });
  }

  renderNotice('Загрузка табло…');
  load();
  setInterval(load, POLL_MS);
  setInterval(function () {
    if (board) renderBoard();
  }, 1000);
})();
