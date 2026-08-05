/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ADMIN_API_URL: string;
  readonly VITE_TV_BOARD_URL?: string;
  readonly VITE_ADMIN_TV_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
