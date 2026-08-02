import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    target: 'es2020',
    // Один JS-чанк надёжнее в Telegram WebView: меньше гонок/404 на медленной сети.
    cssCodeSplit: false,
    sourcemap: false,
    modulePreload: { polyfill: true },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
