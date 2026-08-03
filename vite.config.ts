import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: '.',
    emptyOutDir: false,
    chunkSizeWarningLimit: 1500,
    target: 'es2022',
    minify: 'esbuild',
    cssMinify: true,
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'src/background/index.ts'),
        'content-ui/index': resolve(__dirname, 'src/content/index.ts'),
        'popup/index': resolve(__dirname, 'src/popup/index.ts'),
      },
      output: {
        entryFileNames: '[name].iife.js',
        format: 'es',
        compact: true,
      },
    },
  },
});
