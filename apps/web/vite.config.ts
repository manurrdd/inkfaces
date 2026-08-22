import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  // Point at the source so `npm run dev` picks up engine edits without a build.
  // fileURLToPath, not `.pathname`: a checkout in a directory with a space in
  // its name would otherwise arrive percent-encoded and fail to resolve.
  resolve: {
    alias: { inkfaces: fileURLToPath(new URL('../../packages/core/src/index.ts', import.meta.url)) },
  },
  build: { target: 'es2022' },
});
