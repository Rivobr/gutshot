import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ErrorBoundary } from './providers/error-boundary';
import './styles/index.css';

// После деплоя новый SW забирает контроль — сразу перезагружаем страницу,
// чтобы не остаться на старом бандле (частая причина «чёрного экрана» в PWA).
if ('serviceWorker' in navigator) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  window.setInterval(
    () => {
      void navigator.serviceWorker.getRegistration().then((registration) => {
        void registration?.update();
      });
    },
    5 * 60 * 1000,
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
