import { Link } from 'react-router-dom';
import { Logo } from '@/shared/ui/Logo';
import { useInstallPrompt } from '@/shared/hooks/use-install-prompt';

export function InstallGuidePage() {
  const { canPrompt, promptInstall, installed, isIos } = useInstallPrompt();

  return (
    <main
      style={{ minHeight: '100dvh', padding: '26px 18px 60px', maxWidth: 1100, margin: '0 auto' }}
    >
      <div className="glow-bg" />

      <header className="row between wrap mb-24">
        <Logo small />
        <Link to="/" style={{ color: 'var(--muted-strong)', fontSize: 13, textDecoration: 'none' }}>
          Закрыть ✕
        </Link>
      </header>

      <div className="center mb-24">
        <h1
          className="serif"
          style={{ fontSize: 'clamp(24px, 5vw, 34px)', textTransform: 'uppercase' }}
        >
          Поставить GUTSHOT
          <br />
          на экран Домой
        </h1>
        <p className="muted-strong mt-8" style={{ fontSize: 13.5 }}>
          Приложение откроется на весь экран — без адресной строки.
        </p>
        {installed && (
          <p className="note gold mt-12" style={{ display: 'inline-block' }}>
            ✓ Уже установлено — откройте иконку GUTSHOT на экране Домой
          </p>
        )}
      </div>

      <div className="inst-grid">
        {/* ANDROID */}
        <section className="card stack-16">
          <div className="row wrap">
            <span className="chip chip-live">ANDROID</span>
            <span className="chip">Chrome · Яндекс · Samsung Internet</span>
          </div>
          <b className="serif" style={{ fontSize: 16 }}>
            Один тап
          </b>

          <div className="row" style={{ alignItems: 'flex-start', gap: 14 }}>
            <span className="step-n">1</span>
            <p style={{ margin: '4px 0 0', fontSize: 13.5 }} className="muted-strong">
              Нажмите кнопку ниже. Браузер покажет{' '}
              <b style={{ color: 'var(--fg)' }}>системный диалог «Установить приложение»</b>.
            </p>
          </div>
          <div className="row" style={{ alignItems: 'flex-start', gap: 14 }}>
            <span className="step-n">2</span>
            <p style={{ margin: '4px 0 0', fontSize: 13.5 }} className="muted-strong">
              Подтвердите «Установить» — иконка появится на экране Домой.
            </p>
          </div>

          {canPrompt ? (
            <button className="btn btn-gold btn-block" onClick={() => void promptInstall()}>
              ＋ Установить приложение
            </button>
          ) : (
            <p className="hint">
              {isIos
                ? 'Ваш браузер не показывает системный диалог — воспользуйтесь инструкцией для iPhone справа.'
                : 'Диалог установки недоступен в этом браузере. Откройте сайт в Chrome и повторите, либо используйте меню браузера → «Установить приложение».'}
            </p>
          )}
        </section>

        {/* IPHONE */}
        <section className="card stack-16">
          <div className="row wrap">
            <span className="chip chip-ruby">IPHONE / IPAD</span>
            <span className="chip">Safari</span>
          </div>
          <b className="serif" style={{ fontSize: 16 }}>
            Три шага вручную
          </b>
          <div className="note" style={{ fontSize: 12 }}>
            В iOS нет системной кнопки установки — Safari ставит сайт через меню «Поделиться». Это
            нормально для всех веб-приложений на iPhone.
          </div>

          <div className="row" style={{ alignItems: 'flex-start', gap: 14 }}>
            <span className="step-n">1</span>
            <p style={{ margin: '4px 0 0', fontSize: 13.5 }} className="muted-strong">
              Откройте сайт в <b style={{ color: 'var(--fg)' }}>Safari</b> и нажмите{' '}
              <b style={{ color: 'var(--fg)' }}>«Поделиться»</b>{' '}
              <span className="muted">(квадрат со стрелкой ↑ внизу экрана)</span>.
            </p>
          </div>
          <div className="row" style={{ alignItems: 'flex-start', gap: 14 }}>
            <span className="step-n">2</span>
            <p style={{ margin: '4px 0 0', fontSize: 13.5 }} className="muted-strong">
              В списке выберите <b style={{ color: 'var(--fg)' }}>«На экран „Домой“»</b>.
            </p>
          </div>
          <div className="row" style={{ alignItems: 'flex-start', gap: 14 }}>
            <span className="step-n">3</span>
            <p style={{ margin: '4px 0 0', fontSize: 13.5 }} className="muted-strong">
              Имя <b style={{ color: 'var(--fg)' }}>GUTSHOT</b> уже подставлено — нажмите
              «Добавить». Готово.
            </p>
          </div>

          <p className="hint center">
            После установки иконка откроет кабинет сразу, если сессия ещё жива.
          </p>
        </section>
      </div>
    </main>
  );
}
