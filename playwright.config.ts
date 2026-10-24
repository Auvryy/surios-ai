import { defineConfig } from '@playwright/test';
export default defineConfig({
	testDir: './tests', fullyParallel: false, workers: 1, timeout: 60000,
	use: { baseURL: 'http://127.0.0.1:5177', headless: true, trace: 'retain-on-failure' },
	webServer: [{ command: 'node tests/fixtures/gemini-server.mjs', url: 'http://127.0.0.1:5198/health', reuseExistingServer: false }, { command: 'npm run dev -- --host 127.0.0.1 --port 5177', url: 'http://127.0.0.1:5177/community', reuseExistingServer: false, timeout: 60000, env: { API_ALLOWED_ORIGINS: 'http://localhost:8081', GEMINI_API_KEY: 'integration-test-only', GOOGLE_GEMINI_BASE_URL: 'http://127.0.0.1:5198', SMTP_HOST: '127.0.0.1', SMTP_PORT: '25279', SMTP_FROM: 'SuriOS <test@example.test>', SMTP_USER: '', SMTP_PASS: '', SMTP_SECURE: 'false', APP_ORIGIN: 'http://127.0.0.1:5177' } }]
});
