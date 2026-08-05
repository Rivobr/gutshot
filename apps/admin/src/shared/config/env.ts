export const env = {
  apiUrl: import.meta.env.VITE_ADMIN_API_URL ?? 'http://localhost:3000/api/v1',
  /** Прямой URL табло без Cloudflare — открывается на Xiaomi без VPN */
  tvBoardUrl: (import.meta.env.VITE_TV_BOARD_URL ?? 'http://159.194.208.116').replace(/\/$/, ''),
  /** Прямой URL админки без Cloudflare */
  adminTvUrl: (import.meta.env.VITE_ADMIN_TV_URL ?? 'http://159.194.208.116:8081').replace(
    /\/$/,
    '',
  ),
};
