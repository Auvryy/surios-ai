import { defineConfig } from '@playwright/test';
process.env.APPROVAL_TEST_ORIGIN = 'http://127.0.0.1:5181';
export default defineConfig({
	testDir: './tests', testMatch: 'account-approval.spec.ts', workers: 1, fullyParallel: false,
	use: { baseURL: 'http://127.0.0.1:5181', headless: true, trace: 'retain-on-failure' },
	webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 5181', url: 'http://127.0.0.1:5181/login', reuseExistingServer: false, env: { SMTP_HOST: '', APP_ORIGIN: '' } }
});
