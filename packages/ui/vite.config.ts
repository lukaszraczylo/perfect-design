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
    // The suite triggers thousands of *expected* dev warnings (hostile input, partial trees, jsdom
    // unimplemented APIs); vitest.setup.ts filters the known shapes at the console source. Disabling
    // vitest's per-test console buffering makes every warning route straight through that filter, so
    // a full run prints only warnings that are genuinely new and unexpected.
    disableConsoleIntercept: true,
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
