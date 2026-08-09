import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import { ErrorBoundary } from './providers/error-boundary';
import './styles/index.css';

// Автообновление PWA: после деплоя не оставляем пользователя на старом бандле
// (типичная причина «чёрного экрана» в установленном приложении / Safari).
registerSW({
  immediate: true,
  onRegisteredSW(_url, registration) {
    if (!registration) return;
    window.setInterval(
      () => {
        void registration.update();
      },
      5 * 60 * 1000,
    );
  },
});

let refreshing = false;
navigator.serviceWorker?.addEventListener('controllerchange', () => {
  if (refreshing) return;
  refreshing = true;
  window.location.reload();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
