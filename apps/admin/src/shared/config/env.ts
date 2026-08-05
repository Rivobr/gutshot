export const env = {
  apiUrl: import.meta.env.VITE_ADMIN_API_URL ?? 'http://localhost:3000/api/v1',
  /** Табло: dns-only (серое облако) → напрямую на VPS, Xiaomi без VPN */
  tvBoardUrl: (import.meta.env.VITE_TV_BOARD_URL ?? 'https://tv.gutshotapp.ru').replace(/\/$/, ''),
  /** Админка на ТВ: dns-only admin.* */
  adminTvUrl: (import.meta.env.VITE_ADMIN_TV_URL ?? 'https://admin.gutshotapp.ru').replace(
    /\/$/,
    '',
  ),
};
