import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.ts',
  timeout: 300_000,
  expect: { timeout: 60_000 },
  retries: 0,
  workers: 1,
  reporter: [['list']],
  outputDir: '../test-results'
})
