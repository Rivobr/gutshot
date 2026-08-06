import { useEffect, useState } from 'react';
import { useBoard, useCountdown } from './useBoard';

function formatClock(totalSec: number | null | undefined): string {
  if (totalSec == null || totalSec < 0) return '—';
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
}

function formatAmount(value: number | null | undefined): string {
  return value == null ? '—' : value.toLocaleString('ru-RU');
}

/** Фирменный логотип из бота / Mini App. */
function BrandLogo(): JSX.Element {
  return (
    <img className="brand-logo" src="/gutshot-logo.png" alt="GUTSHOT" width={160} height={160} />
  );
}

function isFullscreen(): boolean {
  const doc = document as Document & { webkitFullscreenElement?: Element | null };
  return !!(doc.fullscreenElement || doc.webkitFullscreenElement);
}

async function enterFullscreen(): Promise<void> {
  const el = document.documentElement as HTMLElement & {
    webkitRequestFullscreen?: () => void;
  };
  if (el.requestFullscreen) await el.requestFullscreen();
  else el.webkitRequestFullscreen?.();
}

async function exitFullscreen(): Promise<void> {
  const doc = document as Document & { webkitExitFullscreen?: () => void };
  if (doc.exitFullscreen) await doc.exitFullscreen();
  else doc.webkitExitFullscreen?.();
}

export function Board(): JSX.Element {
  const { board, clockSkewMs, isOffline, isLoading } = useBoard();
  const [fullscreen, setFullscreen] = useState(false);
  const clock = board?.clock;
  const running = clock?.status === 'RUNNING';

  const secondsLeft = useCountdown(clock?.levelEndsAt, clockSkewMs, running);
  const secondsToBreak = useCountdown(clock?.breakAt, clockSkewMs, running);

  useEffect(() => {
    const sync = () => setFullscreen(isFullscreen());
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'f' || event.key === 'F' || event.key === 'ф' || event.key === 'Ф') {
        event.preventDefault();
        void (isFullscreen() ? exitFullscreen() : enterFullscreen());
      }
    };
    const onDblClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('button, a, input')) return;
      void (isFullscreen() ? exitFullscreen() : enterFullscreen());
    };

    sync();
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync as EventListener);
    document.addEventListener('keydown', onKey);
    document.addEventListener('dblclick', onDblClick);
    return () => {
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('webkitfullscreenchange', sync as EventListener);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('dblclick', onDblClick);
    };
  }, []);

  const toggleFullscreen = () => {
    void (isFullscreen() ? exitFullscreen() : enterFullscreen());
  };

  if (isLoading) {
    return (
      <div className="board">
        <div className="notice">
          <BrandLogo />
          <p className="notice-text">Загружаем табло…</p>
        </div>
      </div>
    );
  }

  if (!board || !clock) {
    return (
      <div className="board">
        <div className="notice">
          <BrandLogo />
          <div className="rule" />
          <p className="notice-text">Ближайших турниров нет</p>
        </div>
      </div>
    );
  }

  const current = clock.current;
  const isBreak = current?.isBreak ?? false;
  const notStarted = clock.status === 'IDLE';
  const finished = clock.status === 'FINISHED';

  const levelLeft = secondsLeft ?? clock.secondsLeft;
  const breakLeft = secondsToBreak ?? clock.secondsToBreak;

  const nextBlinds =
    clock.next && !clock.next.isBreak
      ? `${formatAmount(clock.next.smallBlind)} / ${formatAmount(clock.next.bigBlind)}`
      : clock.next?.isBreak
        ? 'Перерыв'
        : null;

  return (
    <div className={`board${fullscreen ? ' is-fs' : ''}`}>
      {isOffline && (
        <div className="offline">нет связи — табло держит последние данные, переподключение…</div>
      )}

      <header className="head">
        <BrandLogo />
        <div className="rule" />
        <div className="event">{board.tournament.title}</div>
      </header>

      <main className="center">
        {isBreak ? (
          <div className="break-banner">
            <div className="blind-label">Перерыв</div>
            <div className="break-title">{formatClock(levelLeft)}</div>
          </div>
        ) : (
          <>
            <div className="blind">
              <div className="blind-label">Малый</div>
              <div className="blind-value">{formatAmount(current?.smallBlind)}</div>
            </div>
            <div className="divider" />
            <div className="blind">
              <div className="blind-label">Большой</div>
              <div className="blind-value">{formatAmount(current?.bigBlind)}</div>
            </div>
          </>
        )}
      </main>

      {nextBlinds && !finished && (
        <p className="next-level">
          Далее<b>{nextBlinds}</b>
        </p>
      )}

      <section className="stats">
        <div className="stat">
          <div className="stat-label">Уровень</div>
          <div className="stat-value">
            {isBreak ? '—' : current?.number != null ? current.number : '—'}
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">{isBreak ? 'До продолжения' : 'До смены'}</div>
          <div className={`stat-value${(levelLeft ?? 999) <= 60 && running ? ' warn' : ''}`}>
            {formatClock(levelLeft)}
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">До перерыва</div>
          <div className="stat-value">{isBreak ? 'Идёт' : formatClock(breakLeft)}</div>
        </div>
      </section>

      <footer className="foot">
        <span className="foot-item">
          Играют<b>{clock.playersIn ?? '—'}</b>
        </span>
        <span className="pill">
          <span className={`dot${running ? '' : ' idle'}`} />
          {running ? 'Live' : notStarted ? 'Скоро старт' : finished ? 'Финиш' : 'Пауза'}
        </span>
        <span className="foot-item">
          Ante<b>{isBreak ? '—' : formatAmount(current?.ante)}</b>
        </span>
      </footer>

      {!fullscreen && (
        <>
          <button type="button" className="fs-btn" onClick={toggleFullscreen}>
            На весь экран
          </button>
          <div className="fs-hint">F11 или F · двойной клик</div>
        </>
      )}
    </div>
  );
}
