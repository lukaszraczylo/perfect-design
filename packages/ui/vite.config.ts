import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitest/config'

export default defineConfig(({ command }) => ({
  plugins: [vue(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  ...(command === 'build'
    ? {
        build: {
          lib: { entry: 'src/index.ts', formats: ['es'], fileName: 'index' },
          outDir: 'dist',
          emptyOutDir: true,
          rollupOptions: { external: ['vue', 'pinia', 'reka-ui', 'tailwind-merge'] },
          sourcemap: true,
        },
      }
    : {}),
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.ts'],
    css: false,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,vue}'],
      exclude: ['src/**/*.test.ts', 'src/**/*.docs.ts', 'src/**/index.ts', 'src/**/*.d.ts', 'src/**/testing.ts'],
      reporter: ['text-summary', 'json-summary', 'html'],
      thresholds: { statements: 95, branches: 90, functions: 95, lines: 95 },
    },
  },
}))
