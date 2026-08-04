/**
 * SPA отдаётся и как /t.html (вход из бота через boot.html).
 * Этот модуль ОБЯЗАН импортироваться до createBrowserRouter:
 * иначе роутер успевает прочитать pathname=/t.html и открывает NotFound.
 */
if (typeof window !== 'undefined' && /\.html$/i.test(window.location.pathname)) {
  const next = `/${window.location.search}${window.location.hash}` || '/';
  window.history.replaceState(null, '', next === '/' ? '/' : next);
}
