import { defineConfig } from '@playwright/test';
export default defineConfig({
    testDir: './tests', testMatch: 'post-sharing.spec.ts',
    fullyParallel: false, workers: 1, timeout: 60000,
    use: { baseURL: 'http://127.0.0.1:5187', headless: true, trace: 'retain-on-failure' },
    webServer: {
        command: 'npm run dev -- --host 127.0.0.1 --port 5187 --strictPort',
        url: 'http://127.0.0.1:5187/community', reuseExistingServer: false,
        env: { SMTP_HOST: '', SMTP_FROM: '', APP_ORIGIN: '' }
    }
});
