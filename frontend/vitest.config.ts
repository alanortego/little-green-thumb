/// <reference types="vitest/config" />
import { defineConfig, mergeConfig } from 'vite';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      include: ['tests/**/*.test.tsx', 'tests/**/*.test.ts'],
      globals: true,
      setupFiles: ['./tests/setup.ts'],
    },
  }),
);
