import { test, expect } from '@playwright/test';
import postgres from 'postgres';
import { randomUUID } from 'node:crypto';
const sql = postgres(process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5433/surios', { max: 1 });
const ids: string[] = [];
const prefix = `Map QA ${randomUUID().slice(0, 8)}`;
test.beforeAll(async () => {
	for (const [index, config] of [
		{ severity: 5, support: 9, status: 'REPORTED', type: 'pothole' },
		{ severity: 6, support: 1, status: 'REPORTED', type: 'pothole' },
		{ severity: 9, support: 2, status: 'DISPATCHED', type: 'pothole' },
		{ severity: 4, support: 1, status: 'REPORTED', type: 'alligator_cracking' }
	].entries()) {
		const id = randomUUID(); ids.push(id);
		const point = index === 3 ? 0 : index;
		const analysis = { isValidInfrastructure: true, distressType: config.type, hazardSeverity: config.severity, riskLevel: config.severity >= 8 ? 'CRITICAL' : 'MODERATE', vruLethality: 'LOW', vruDetails: 'Inspect the road surface.', recommendedAction: 'Inspect and repair.', materialsChecklist: [], summary: 'Map verification evidence.', estimatedDimensions: { depthEstimate: 'Unmeasured', surfaceAreaEstimate: 'Unmeasured' }, urgency: 'PRIORITY', headline: `${prefix} ${index}`, civicAddress: 'Santa Cruz verification site', supportBaseline: config.support };
		await sql`insert into reports (id, image_path, latitude, longitude, distress_type, hazard_severity, risk_level, vru_lethality, recommended_action, status, community_confirmations, triage_payload) values (${id}, '/samples/pothole-severe.jpg', ${14.30 + point * .002}, ${121.44 + point * .002}, ${config.type}, ${config.severity}, ${analysis.riskLevel}, 'LOW', 'Inspect and repair.', ${config.status}, ${config.support}, ${sql.json(analysis)})`;
	}
});
test.afterAll(async () => { if (ids.length) await sql`delete from reports where id in ${sql(ids)}`; await sql.end(); });

test('feed is the landing page; sidebar collapses, persists, and restores map space', async ({ page }) => {
	await page.goto('/'); await page.waitForLoadState('networkidle'); await expect(page).toHaveURL(/\/community$/);
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.getByRole('link', { name: 'Road hazards', exact: true }).click(); await page.locator('.leaflet-container').waitFor();
	const before = await page.getByLabel('Road hazard map', { exact: true }).boundingBox();
	await page.getByRole('button', { name: 'Collapse navigation', exact: true }).click();
	const after = await page.getByLabel('Road hazard map', { exact: true }).boundingBox(); expect(after!.width).toBeGreaterThan(before!.width);
	await page.reload(); await page.waitForLoadState('networkidle'); await expect(page.getByRole('button', { name: 'Expand navigation' })).toBeVisible();
	await page.getByRole('button', { name: 'Expand navigation', exact: true }).click(); await expect(page.getByRole('link', { name: 'Road hazards', exact: true })).toBeVisible();
	await page.setViewportSize({ width: 375, height: 812 }); await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
	await page.getByRole('link', { name: 'Community feed', exact: true }).click(); await expect(page).toHaveURL(/\/community$/);
});

test('floating map filters and sorting drive compact collapsible report cards', async ({ page }) => {
	const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message));
	await page.goto('/map'); await page.waitForLoadState('networkidle');
	await page.getByRole('button', { name: 'Filters', exact: true }).click();
	await page.getByRole('textbox', { name: 'Search map reports' }).fill(prefix);
	await page.getByRole('combobox', { name: 'Hazard status' }).selectOption('REPORTED');
	await page.getByRole('combobox', { name: 'Damage type' }).selectOption('pothole');
	await page.getByRole('button', { name: 'Show matching reports', exact: true }).click();
	const list = page.getByRole('complementary', { name: 'Hazard report list' });
	await expect(list.getByRole('button', { name: `Open hazard: ${prefix} 0`, exact: true })).toBeVisible();
	await expect(list.getByRole('button', { name: `Open hazard: ${prefix} 2`, exact: true })).toHaveCount(0);
	await expect(list.getByRole('button', { name: /Open hazard:/ }).first()).toHaveAttribute('aria-label', `Open hazard: ${prefix} 0`);
	await page.getByRole('button', { name: /^Filters/ }).click(); await page.getByRole('combobox', { name: 'Sort reports' }).selectOption('severity'); await page.getByRole('button', { name: 'Show matching reports', exact: true }).click();
	await expect(list.getByRole('button', { name: /Open hazard:/ }).first()).toHaveAttribute('aria-label', `Open hazard: ${prefix} 1`);
	await page.getByRole('button', { name: 'Close report list', exact: true }).click(); await expect(list).toBeHidden();
	await page.getByRole('button', { name: 'Layers', exact: true }).click(); await page.getByRole('combobox', { name: 'Basemap style' }).selectOption('muted'); await page.getByRole('checkbox', { name: 'Reference roads', exact: true }).check(); await page.getByRole('button', { name: 'Close map controls' }).click();
	await page.getByRole('button', { name: 'Legend', exact: true }).click(); await expect(page.getByRole('region', { name: 'Map legend' })).toContainText('priority, not damage severity'); await page.getByRole('button', { name: 'Close map controls' }).click();
	await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
	for (const [width, height] of [[1440, 900], [768, 1024], [375, 812], [320, 740], [812, 375]]) {
		await page.setViewportSize({ width, height }); expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
		const bounds = await page.getByLabel('Road hazard map', { exact: true }).boundingBox(); expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(height + 1);
		await page.getByRole('button', { name: 'Show report list', exact: true }).click();
		const panel = await list.boundingBox(); expect(panel!.x).toBeGreaterThanOrEqual(0); expect(panel!.x + panel!.width).toBeLessThanOrEqual(width + 1); expect(panel!.y + panel!.height).toBeLessThanOrEqual(height);
		await page.getByRole('button', { name: 'Close report list', exact: true }).click();
	}
	expect(errors).toEqual([]);
});

test('deep-linked report details show separate severity, support, priority, and evidence', async ({ page }) => {
	await page.goto(`/map?report=${ids[0]}`); await page.waitForLoadState('networkidle');
	const detail = page.getByRole('region', { name: 'Hazard details' });
	await expect(detail.getByRole('heading', { name: `${prefix} 0`, exact: true })).toBeVisible();
	await expect(detail).toContainText('Severity'); await expect(detail).toContainText('Support'); await expect(detail).toContainText('Priority');
	await detail.getByRole('button', { name: 'More details', exact: true }).click();
	await page.getByText('Why this priority?', { exact: true }).click(); await expect(detail).toContainText('Reposting does not add damage severity.');
	await page.getByRole('button', { name: 'Close hazard details', exact: true }).click(); await expect(detail).toBeHidden();
	await page.getByRole('button', { name: 'Refresh reports', exact: true }).click(); await expect(page.getByRole('button', { name: 'Refresh reports', exact: true })).toBeEnabled();
});
