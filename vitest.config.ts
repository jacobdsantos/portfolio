import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    include: ['src/**/__tests__/**/*.test.ts'],
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@lib': resolve(__dirname, './src/lib'),
      '@data': resolve(__dirname, './src/data'),
    },
  },
});
