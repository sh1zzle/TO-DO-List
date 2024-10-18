// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.{test,spec}.{ts,js}'],
    exclude: ['**/node_modules/**'],
    silent: false, // Allow logs to be printed
  },
});

console.log('Vitest Configuration:', {
  include: ['src/**/*.{test,spec}.{ts,js}'],
  exclude: ['**/node_modules/**'],
});
