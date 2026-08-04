import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/index.css';

// SPA-шелл раздаётся ещё и как /t.html (вход из бота через boot.html):
// без нормализации роутер видит несуществующий путь и открывает NotFound.
if (/\.html$/.test(window.location.pathname)) {
  window.history.replaceState(null, '', `/${window.location.hash}`);
}

const root = createRoot(document.getElementById('root')!);
const tree = import.meta.env.DEV ? (
  <StrictMode>
    <App />
  </StrictMode>
) : (
  <App />
);

root.render(tree);
