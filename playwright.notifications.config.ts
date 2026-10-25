import { defineConfig } from '@playwright/test';
export default defineConfig({
	testDir: './tests', testMatch: 'notifications.spec.ts', workers: 1, timeout: 30000,
	use: { baseURL: process.env.SURIOS_TEST_API_ORIGIN || 'https://127.0.0.1:5193', ignoreHTTPSErrors: true },
	outputDir: 'test-results/notifications'
});
