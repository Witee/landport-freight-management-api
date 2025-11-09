import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    setupFiles: ['test/setup.ts'],
    globals: true,
    environment: 'node',
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    sequence: {
      concurrent: false,
    },
  },
  esbuild: {
    target: 'node22',
    format: 'esm',
  },
  resolve: {
    alias: {
      '@app': resolve(__dirname, './app'),
      '@config': resolve(__dirname, './config'),
    },
    extensions: ['.ts', '.js', '.mjs', '.cjs'],
  },
});
