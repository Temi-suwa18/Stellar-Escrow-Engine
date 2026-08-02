import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  // Next's own build (SWC) uses the automatic JSX runtime everywhere, so no
  // component in this codebase ever `import React`s just to use JSX. Vite's
  // default esbuild transform doesn't know that on its own — without this,
  // every component render in a test fails with "React is not defined".
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    environment: 'jsdom',
    environmentOptions: {
      jsdom: { url: 'http://localhost:3000' },
    },
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
