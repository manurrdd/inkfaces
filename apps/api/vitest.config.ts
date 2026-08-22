import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { inkfaces: fileURLToPath(new URL('../../packages/core/src/index.ts', import.meta.url)) },
  },
});
