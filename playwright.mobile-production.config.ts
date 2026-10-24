import { defineConfig } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const artifacts = fileURLToPath(new URL('./.svelte-kit/', import.meta.url));
mkdirSync(artifacts, { recursive: true });
const tlsDirectory = process.env.MOBILE_API_TEST_TLS_DIR || mkdtempSync(join(artifacts, 'mobile-smtp-'));
const cert = join(tlsDirectory, 'cert.pem');
const key = join(tlsDirectory, 'key.pem');
if (!existsSync(cert) || !existsSync(key)) execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1', '-subj', '/CN=localhost', '-addext', 'subjectAltName=DNS:localhost,IP:127.0.0.1', '-keyout', key, '-out', cert], { stdio: 'ignore' });
process.env.MOBILE_API_TEST_TLS_DIR = tlsDirectory;

process.env.MOBILE_API_TEST_ORIGIN = 'http://localhost:5184';
export default defineConfig({
	testDir: './tests', testMatch: 'mobile-api.spec.ts', workers: 1, fullyParallel: false, timeout: 60000,
	use: { baseURL: process.env.MOBILE_API_TEST_ORIGIN, headless: true, trace: 'retain-on-failure' },
	webServer: [
		{ command: 'node tests/fixtures/gemini-server.mjs', url: 'http://127.0.0.1:5198/health', reuseExistingServer: false },
		{ command: 'npm run build && npm run preview:production', url: 'http://localhost:5184/api', reuseExistingServer: false, timeout: 120000, env: {
			PORT: '5184', API_ALLOWED_ORIGINS: 'http://localhost:8081', GEMINI_API_KEY: 'integration-test-only', GOOGLE_GEMINI_BASE_URL: 'http://127.0.0.1:5198',
			SMTP_HOST: '127.0.0.1', SMTP_PORT: '25279', SMTP_FROM: 'SuriOS <test@example.test>', SMTP_USER: '', SMTP_PASS: '', SMTP_SECURE: 'true', NODE_EXTRA_CA_CERTS: cert,
			// Production SMTP configuration requires HTTPS. Tests extract the token;
			// the local HTTP preview does not follow this illustrative email URL.
			APP_ORIGIN: 'https://localhost:5184'
		} }
	]
});
