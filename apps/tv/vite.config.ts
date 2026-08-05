import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/** Xiaomi YaBrowser Lite не выполняет script type=module — только классический <script defer>. */
function classicScripts(): Plugin {
  return {
    name: 'gutshot-classic-scripts',
    transformIndexHtml(html) {
      return html
        .replace(/\s*type="module"/g, '')
        .replace(/\s*crossorigin/g, '')
        .replace(/<script(\s+)/g, '<script defer$1');
    },
  };
}

export default defineConfig({
  // Относительные пути: табло одинаково работает и на своём домене, и на /tv/.
  base: './',
  plugins: [react(), classicScripts()],
  server: {
    port: 5175,
  },
  build: {
    // YaBrowser Lite на Xiaomi TV ломается на ES modules — отдаём классический IIFE.
    target: 'es2015',
    cssTarget: 'chrome61',
    cssCodeSplit: false,
    modulePreload: false,
    sourcemap: false,
    rollupOptions: {
      output: {
        format: 'iife',
        name: 'GutshotTV',
        inlineDynamicImports: true,
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});
