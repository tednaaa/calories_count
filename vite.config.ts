/// <reference types="vitest/config" />

import { createRequire } from 'node:module';
import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import VueRouter from 'vue-router/vite';

const { version } = createRequire(import.meta.url)('./package.json');

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
  },

  server: {
    port: 5577,
    host: '127.0.0.1',
  },

  plugins: [
    VueRouter({
      dts: 'src/globals/route-map.d.ts',
      exclude: ['src/pages/**/ui/**/*.vue'],
    }),
    vue(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  test: {
    globals: true,
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,
    open: false,
    projects: [
      {
        extends: true,
        test: {
          include: ['src/**/*.spec.ts'],
          setupFiles: ['./spec.setup.ts'],
          name: 'unit',
          environment: 'jsdom',
        },
      },
    ],
  },
});
