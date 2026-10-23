import { defineConfig } from '@playwright/test';
export default defineConfig({
	testDir: './tests', fullyParallel: false, workers: 1, timeout: 60000,
	use: { baseURL: 'http://127.0.0.1:5177', headless: true, trace: 'retain-on-failure' },
	webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 5177', url: 'http://127.0.0.1:5177/community', reuseExistingServer: false, timeout: 60000 }
});
