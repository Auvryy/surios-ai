import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir: './tests', testMatch: 'routing.spec.ts', workers: 1 });
