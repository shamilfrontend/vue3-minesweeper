import { resolve } from 'node:path';

import legacy from '@vitejs/plugin-legacy';
import vue from '@vitejs/plugin-vue';
import autoprefixer from 'autoprefixer';
import { defineConfig } from 'vite';

export default defineConfig(() => ({
  plugins: [vue(), legacy()],

  css: { postcss: { plugins: [autoprefixer] } },

  server: { port: 3000 },

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vue: ['pinia', 'vue', 'vue-router']
        }
      }
    }
  },

  resolve: {
    alias: [
      // @/xxxx => src/xxxx
      { find: /^@\/(.+)/, replacement: `${resolve(__dirname, 'src')}/$1` }
    ]
  }
}));
