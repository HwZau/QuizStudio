const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  expect: { timeout: 5000 },
  reporter: [['list']],
  outputDir: 'test-results',
  use: {
    browserName: 'chromium',
    viewport: { width: 1472, height: 760 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  }
});
