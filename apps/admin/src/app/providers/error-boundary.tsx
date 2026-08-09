import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/** Ловит падения React, чтобы вместо чёрного экрана показать кнопку перезагрузки. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Admin UI crash', error, info.componentStack);
  }

  private reload = () => {
    window.location.reload();
  };

  private hardReset = async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      const registrations = await navigator.serviceWorker?.getRegistrations();
      await Promise.all((registrations ?? []).map((item) => item.unregister()));
      const keys = await caches?.keys();
      await Promise.all((keys ?? []).map((key) => caches.delete(key)));
    } catch {
      // ignore cleanup errors
    }
    window.location.href = '/login?reset=1';
  };

  render(): ReactNode {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#090909',
          color: '#f5edd6',
          padding: 24,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>Не удалось открыть панель</h1>
          <p style={{ margin: 0, color: '#a09078', lineHeight: 1.5 }}>
            Обычно это старый кэш после обновления. Нажмите «Обновить» или «Сбросить кэш».
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button
              type="button"
              onClick={this.reload}
              style={{
                border: 0,
                borderRadius: 10,
                padding: '10px 16px',
                background: '#d8b36a',
                color: '#090909',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Обновить
            </button>
            <button
              type="button"
              onClick={() => void this.hardReset()}
              style={{
                border: '1px solid rgba(184,134,59,0.35)',
                borderRadius: 10,
                padding: '10px 16px',
                background: '#151515',
                color: '#f5edd6',
                cursor: 'pointer',
              }}
            >
              Сбросить кэш
            </button>
          </div>
        </div>
      </div>
    );
  }
}
