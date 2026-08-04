import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/index.css';

// Дубль нормализации пути (основная — inline в index.html и в router/normalize-spa-path).
if (/\.html$/i.test(window.location.pathname)) {
  window.history.replaceState(null, '', `/${window.location.search}${window.location.hash}`);
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
