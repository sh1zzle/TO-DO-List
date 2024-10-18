// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.{test,spec}.{ts,js}'],
    exclude: ['**/node_modules/**'],
    silent: false,
  },
});
