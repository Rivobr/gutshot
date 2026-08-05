export const env = {
  apiUrl: import.meta.env.VITE_ADMIN_API_URL ?? 'http://localhost:3000/api/v1',
  /** Табло по HTTP — надёжнее на Xiaomi, чем HTTPS */
  tvBoardUrl: (import.meta.env.VITE_TV_BOARD_URL ?? 'http://tv.gutshotapp.ru').replace(/\/$/, ''),
  /** Админка на ТВ по HTTP */
  adminTvUrl: (import.meta.env.VITE_ADMIN_TV_URL ?? 'http://admin.gutshotapp.ru').replace(
    /\/$/,
    '',
  ),
};
