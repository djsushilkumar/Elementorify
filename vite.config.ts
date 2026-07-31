import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: '.',
    emptyOutDir: false,
    rollupOptions: {
      input: {
        'content-ui/index': resolve(__dirname, 'src/content/index.ts'),
        'popup/index': resolve(__dirname, 'src/popup/index.ts'),
      },
      output: {
        entryFileNames: '[name].iife.js',
        format: 'es',
      },
    },
  },
});
