import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Относительные пути: табло одинаково работает и на своём домене, и на /tv/.
  base: './',
  plugins: [react()],
  server: {
    port: 5175,
  },
  build: {
    target: 'es2019',
    cssCodeSplit: false,
    sourcemap: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
