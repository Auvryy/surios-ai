import { test, expect, type APIRequestContext, type Locator } from '@playwright/test';
import postgres from 'postgres';
import { randomUUID, scryptSync } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const sql = postgres(process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5433/surios', { max: 1 });
const origin = 'http://127.0.0.1:5177';
const password = 'GovernmentWorkspace123!';
const salt = randomUUID();
const passwordHash = `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
const roles = ['ENGINEER', 'OFFICER', 'ADMIN'] as const;
const accounts = [...roles, 'CITIZEN'].map((role) => ({
	id: randomUUID(), role, name: `Government QA ${role} ${randomUUID().slice(0, 8)}`,
	email: `${randomUUID()}@example.test`
}));
const registrationEmails: string[] = [];
const reportIds = [randomUUID(), randomUUID(), randomUUID()];
const postId = randomUUID();
const title = `Government lifecycle QA ${randomUUID().slice(0, 8)}`;
const nativeTitle = `Government native QA ${randomUUID().slice(0, 8)}`;
const uploadedEvidence = new Set<string>();
const analysis = { isValidInfrastructure: true, distressType: 'pothole', hazardSeverity: 5, riskLevel: 'MODERATE', vruLethality: 'LOW', vruDetails: 'Inspect on site.', summary: 'Government lifecycle test evidence.', recommendedAction: 'Inspect and repair.', materialsChecklist: [], estimatedDimensions: { depthEstimate: 'Unmeasured', surfaceAreaEstimate: 'Unmeasured' }, urgency: 'PRIORITY', headline: title, civicAddress: 'Government lifecycle test site' };
const retainedLinks = [
	['Feed', '/community'], ['Road hazards', '/map'], ['Report a hazard', '/report'],
	['Confirmed updates', '/liked'], ['Account', '/profile'], ['Settings', '/settings']
] as const;
const retiredPaths = ['/verification', '/analytics', '/docs', '/crews'];
const invalidReturns = ['https://example.test/', '//example.test/', '/\\example.test/'];

async function login(api: APIRequestContext, account = accounts[0], redirectTo = '') {
	return api.post('/login', {
		headers: { Origin: origin, Accept: 'text/html' }, maxRedirects: 0,
		form: { email: account.email, password, redirectTo }
	});
}
function expectRedirect(response: Awaited<ReturnType<APIRequestContext['get']>>, destination: string) {
	expect(response.status()).toBe(303);
	expect(response.headers().location).toBe(destination);
}
async function assertGovernmentLinks(nav: Locator) {
	for (const [name, href] of retainedLinks) {
		await expect(nav.getByRole('link', { name, exact: true })).toBeVisible();
		await expect(nav.getByRole('link', { name, exact: true })).toHaveAttribute('href', href);
	}
	await expect(nav.getByRole('link', { name: 'Work orders', exact: true })).toHaveAttribute('href', '/dashboard');
	await expect(nav.getByRole('link')).toHaveCount(7);
	for (const href of retiredPaths) await expect(nav.locator(`a[href="${href}"]`)).toHaveCount(0);
}

test.beforeAll(async () => {
	for (const account of accounts) {
		await sql`insert into users (id, name, email, role, password_hash) values (${account.id}, ${account.name}, ${account.email}, ${account.role}, ${passwordHash})`;
	}
	for (const [index, id] of reportIds.entries()) {
		await sql`insert into reports (id, image_path, latitude, longitude, distress_type, hazard_severity, risk_level, vru_lethality, recommended_action, status, triage_payload) values (${id}, '/samples/pothole-severe.jpg', 14.3, 121.44, 'pothole', 5, 'MODERATE', 'LOW', 'Inspect and repair.', ${index === 1 ? 'AWAITING_REVIEW' : 'REPORTED'}, ${sql.json(index === 2 ? { ...analysis, headline: nativeTitle } : analysis)})`;
	}
	const photoId = randomUUID();
	await sql`insert into community_posts (id, user_id, draft_id, report_id, title, body, location_name, latitude, longitude, media, cover_id, analysis) values (${postId}, ${accounts[3].id}, ${randomUUID()}, ${reportIds[0]}, ${title}, 'Government lifecycle test post.', 'Government lifecycle test site', 14.3, 121.44, ${sql.json([{ id: photoId, url: '/samples/pothole-severe.jpg', kind: 'photo', name: 'evidence.jpg', mimeType: 'image/jpeg' }])}, ${photoId}, ${sql.json(analysis)})`;
});
test.afterAll(async () => {
	const historicalEvidence = await sql`select image_path from work_order_events where report_id in ${sql(reportIds)}`;
	for (const event of historicalEvidence) if (event.image_path) uploadedEvidence.add(event.image_path);
	const evidence = await sql`select resolved_image_path from reports where id in ${sql(reportIds)}`;
	for (const report of evidence) if (report.resolved_image_path) uploadedEvidence.add(report.resolved_image_path);
	await sql`delete from community_posts where id = ${postId}`;
	await sql`delete from reports where id in ${sql(reportIds)}`;
	await sql`delete from users where id in ${sql(accounts.map((account) => account.id))}`;
	if (registrationEmails.length) await sql`delete from users where email in ${sql(registrationEmails)}`;
	await sql.end();
	await Promise.all([...uploadedEvidence].filter((url) => /^\/media\/[0-9a-f-]{36}\.(jpg|png|webp)$/.test(url)).map((url) => fs.rm(path.join('static/uploads/community', path.basename(url)), { force: true })));
});

for (const role of roles) {
	test(`${role} retains shared pages, correct active navigation, and working account controls`, async ({ page }) => {
		const account = accounts.find((candidate) => candidate.role === role)!;
		const browserErrors: string[] = [];
		const serverErrors: string[] = [];
		page.on('pageerror', (error) => browserErrors.push(error.message));
		page.on('response', (response) => {
			if (response.url().startsWith(origin) && response.status() >= 500) serverErrors.push(response.url());
		});
		expectRedirect(await login(page.request, account), '/community');
		await page.setViewportSize({ width: 1440, height: 900 });
		await page.goto('/community');
		const nav = page.getByRole('navigation', { name: 'Main navigation', exact: true });
		await assertGovernmentLinks(nav);
		await expect(nav.getByRole('link', { name: 'Feed', exact: true })).toHaveAttribute('aria-current', 'page');

		await nav.getByRole('link', { name: 'Road hazards', exact: true }).click();
		await expect(page).toHaveURL(`${origin}/map`);
		await expect(page.getByLabel('Road hazard map', { exact: true })).toHaveClass(/leaflet-container/);
		await nav.getByRole('link', { name: 'Report a hazard', exact: true }).click();
		await expect(page).toHaveURL(`${origin}/report`);
		await expect(page.getByLabel('Upload hazard images', { exact: true })).toHaveAttribute('type', 'file');
		await expect(page.getByLabel('Capture hazard photo', { exact: true })).toHaveAttribute('capture', 'environment');
		await expect(page.getByRole('button', { name: 'Take a photo', exact: true })).toBeVisible();

		await nav.getByRole('link', { name: 'Confirmed updates', exact: true }).click();
		await expect(page).toHaveURL(`${origin}/community?tab=confirmed`);
		await expect(page.getByRole('button', { name: 'Confirmed', exact: true })).toHaveAttribute('aria-pressed', 'true');
		await expect(nav.getByRole('link', { name: 'Confirmed updates', exact: true })).toHaveAttribute('aria-current', 'page');
		await expect(nav.getByRole('link', { name: 'Feed', exact: true })).not.toHaveAttribute('aria-current', 'page');

		await nav.getByRole('link', { name: 'Account', exact: true }).click();
		await expect(page).toHaveURL(`${origin}/profile`);
		await expect(page.getByRole('heading', { name: account.name, exact: true })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Edit profile', exact: true })).toBeVisible();
		await nav.getByRole('link', { name: 'Settings', exact: true }).click();
		await expect(page).toHaveURL(`${origin}/settings`);
		await expect(page.getByRole('heading', { name: 'Email notifications', exact: true })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Password & security', exact: true })).toBeVisible();

		await nav.getByRole('link', { name: 'Feed', exact: true }).click();
		await expect(page).toHaveURL(`${origin}/community`);
		await page.goto(`/community?profile=${accounts[3].id}`);
		await expect(page.getByRole('heading', { name: accounts[3].name, exact: true })).toBeVisible();
		await expect(nav.getByRole('link', { name: 'Feed', exact: true })).toHaveAttribute('aria-current', 'page');
		await expect(nav.getByRole('link', { name: 'Confirmed updates', exact: true })).not.toHaveAttribute('aria-current', 'page');
		expect(browserErrors).toEqual([]);
		expect(serverErrors).toEqual([]);
	});
}

test('government links survive collapse, reload, and mobile navigation', async ({ page }) => {
	expectRedirect(await login(page.request), '/community');
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/community');
	await page.waitForLoadState('networkidle');
	await page.getByRole('button', { name: 'Collapse navigation', exact: true }).click();
	await assertGovernmentLinks(page.getByRole('navigation', { name: 'Collapsed navigation', exact: true }));
	await page.reload();
	await expect(page.getByRole('button', { name: 'Expand navigation', exact: true })).toBeVisible();
	await page.getByRole('navigation', { name: 'Collapsed navigation', exact: true }).getByRole('link', { name: 'Settings', exact: true }).click();
	await expect(page).toHaveURL(`${origin}/settings`);
	await page.getByRole('button', { name: 'Expand navigation', exact: true }).click();
	await page.setViewportSize({ width: 375, height: 812 });
	await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
	const drawer = page.getByRole('dialog');
	await assertGovernmentLinks(drawer.getByRole('navigation', { name: 'Main navigation', exact: true }));
	await drawer.getByRole('link', { name: 'Report a hazard', exact: true }).click();
	await expect(page).toHaveURL(`${origin}/report`);
	await expect(drawer).toBeHidden();
	expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
});

test('citizen navigation keeps its established feed and profile labels', async ({ page }) => {
	expectRedirect(await login(page.request, accounts[3]), '/community');
	await page.goto('/community');
	const nav = page.getByRole('navigation', { name: 'Main navigation', exact: true });
	await expect(nav.getByRole('link', { name: 'Community feed', exact: true })).toHaveAttribute('href', '/community');
	await expect(nav.getByRole('link', { name: 'Profile', exact: true })).toHaveAttribute('href', '/profile');
	await expect(nav.getByRole('link', { name: 'Work orders', exact: true })).toHaveCount(0);
	await expect(nav.getByRole('link')).toHaveCount(6);
	for (const href of retiredPaths) await expect(nav.locator(`a[href="${href}"]`)).toHaveCount(0);
});

test('retired pages redirect by role while dashboard access and route boundaries remain protected', async ({ browser }) => {
	for (const account of [null, ...accounts]) {
		const context = await browser.newContext({ baseURL: origin });
		try {
			if (account) expectRedirect(await login(context.request, account), '/community');
			for (const path of retiredPaths) {
				for (const suffix of ['', '?ticket=old', '/archive']) {
					expectRedirect(await context.request.get(`${path}${suffix}`, { maxRedirects: 0 }), account && account.role !== 'CITIZEN' ? '/dashboard' : '/community');
				}
			}
			const dashboard = await context.request.get('/dashboard', { maxRedirects: 0 });
			if (!account) expectRedirect(dashboard, '/login?redirectTo=%2Fdashboard');
			else if (account.role === 'CITIZEN') expectRedirect(dashboard, '/community');
			else expect(dashboard.status()).toBe(200);
			expect((await context.request.get('/dashboard-other', { maxRedirects: 0 })).status()).toBe(404);
		} finally { await context.close(); }
	}
});

test('login and authenticated auth pages reject unsafe returns and preserve authorized local destinations', async ({ browser }) => {
	const context = await browser.newContext({ baseURL: origin });
	try {
		for (const target of invalidReturns) {
			await context.clearCookies();
			expectRedirect(await login(context.request, accounts[0], target), '/community');
			for (const route of ['/login', '/register']) {
				expectRedirect(await context.request.get(`${route}?redirectTo=${encodeURIComponent(target)}`, { maxRedirects: 0 }), '/community');
			}
		}
		await context.clearCookies();
		expectRedirect(await login(context.request, accounts[0], '/map?report=demo'), '/map?report=demo');
		expectRedirect(await context.request.get('/login?redirectTo=%2Fsettings', { maxRedirects: 0 }), '/settings');
		await context.clearCookies();
		expectRedirect(await login(context.request, accounts[0], '/dashboard'), '/dashboard');
		expectRedirect(await context.request.get('/register?redirectTo=%2Fdashboard', { maxRedirects: 0 }), '/dashboard');
		await context.clearCookies();
		expectRedirect(await login(context.request, accounts[3], '/dashboard'), '/community');
		expectRedirect(await context.request.get('/login?redirectTo=%2Fdashboard', { maxRedirects: 0 }), '/community');
	} finally { await context.close(); }
});

test('government registration preserves work orders access and rejects unsafe return links', async ({ browser }) => {
	for (const [index, role] of ['ENGINEER', 'OFFICER'].entries()) {
		const context = await browser.newContext({ baseURL: origin });
		const email = `${randomUUID()}@example.test`;
		registrationEmails.push(email);
		try {
			const response = await context.request.post('/register', {
				headers: { Origin: origin, Accept: 'text/html' }, maxRedirects: 0,
				form: { name: `Government registration QA ${randomUUID()}`, email, password, role,
					redirectTo: index === 0 ? '/dashboard' : '//example.test/' }
			});
			expectRedirect(response, index === 0 ? '/dashboard' : '/community');
			const page = await context.newPage();
			await page.goto('/community');
			await assertGovernmentLinks(page.getByRole('navigation', { name: 'Main navigation', exact: true }));
		} finally { await context.close(); }
	}
});

test('persona switching defaults to the feed and rejects unsafe return targets', async ({ page }) => {
	expectRedirect(await login(page.request, accounts[3]), '/community');
	for (const redirectTo of ['auto', ...invalidReturns]) {
		const response = await page.request.post('/profile?/switchPersona', {
			headers: { Origin: origin, Accept: 'text/html' }, maxRedirects: 0,
			form: { email: accounts[0].email, redirectTo }
		});
		expectRedirect(response, '/community');
	}
	await page.goto('/community');
	await assertGovernmentLinks(page.getByRole('navigation', { name: 'Main navigation', exact: true }));
});

test('work orders persist assignment, planning estimates, repair evidence, review, and citizen-visible resolution', async ({ page, browser }) => {
	const reportId = reportIds[0];
	expectRedirect(await login(page.request), '/community');
	const act = (name: string, form: Record<string, string>) => page.request.post(`/dashboard?/${name}`, {
		headers: { Origin: origin, Accept: 'text/html' }, maxRedirects: 0, form: { reportId, ...form }
	});
	const assertStatus = async (expected: string) => {
		const [report] = await sql`select status from reports where id = ${reportId}`;
		expect(report.status).toBe(expected);
	};
	const upload = async (notes: string) => {
		const response = await page.request.post('/dashboard?/submitRepair', {
			headers: { Origin: origin, Accept: 'text/html' }, maxRedirects: 0,
			multipart: { reportId, notes, afterImage: { name: 'repair-evidence.jpg', mimeType: 'image/jpeg', buffer: await fs.readFile('static/samples/pothole-severe.jpg') } }
		});
		expect(response.status()).toBe(200);
		const [report] = await sql`select resolved_image_path from reports where id = ${reportId}`;
		expect(report.resolved_image_path).toMatch(/^\/media\/[0-9a-f-]{36}\.jpg$/);
		uploadedEvidence.add(report.resolved_image_path);
		expect((await page.request.get(report.resolved_image_path)).status()).toBe(200);
		await assertStatus('AWAITING_REVIEW');
	};

	await page.goto(`/dashboard?report=${reportId}`);
	const detail = page.getByRole('region', { name: 'Work order details', exact: true });
	await expect(detail.getByRole('heading', { name: title, exact: true })).toBeVisible();
	await page.waitForLoadState('networkidle');
	await page.getByLabel('Crew', { exact: true }).fill('Presentation road crew');
	await page.getByRole('button', { name: 'Assign crew', exact: true }).click();
	await expect(page.getByRole('status')).toHaveText('Work order updated.');
	await assertStatus('DISPATCHED');
	const [assigned] = await sql`select assigned_crew from work_orders where report_id = ${reportId}`;
	expect(assigned.assigned_crew).toBe('Presentation road crew');
	await page.reload();
	await expect(detail.getByRole('heading', { name: title, exact: true })).toBeVisible();
	await expect(page.getByLabel('Crew', { exact: true })).toHaveValue('Presentation road crew');

	expect((await act('startRepair', {})).status()).toBe(200);
	await assertStatus('IN_REPAIR');
	expect((await act('startRepair', {})).status()).toBe(409);
	expect((await act('review', { decision: 'approve', notes: 'Attempt without uploaded repair evidence.' })).status()).toBe(409);
	await assertStatus('IN_REPAIR');
	expect((await act('saveEstimate', { length: '-1', width: '1', depth: '50', density: '2400', bagWeight: '25', bagPrice: '100', wastePercent: '10' })).status()).toBe(400);
	expect((await act('saveEstimate', { length: '2', width: '1', depth: '50', density: '2400', bagWeight: '1e-300', bagPrice: '100', wastePercent: '10' })).status()).toBe(400);
	expect((await act('saveEstimate', { length: '2', width: '1', depth: '50', density: '2400', bagWeight: '25', bagPrice: '100', wastePercent: '10' })).status()).toBe(200);
	const [planned] = await sql`select estimate from work_orders where report_id = ${reportId}`;
	expect(planned.estimate.volume).toBeCloseTo(0.1);
	expect(planned.estimate.mass).toBeCloseTo(264);
	expect(planned.estimate.bags).toBe(11);
	expect(planned.estimate.cost).toBe(1100);

	await upload('Repair completed; attached after-photo for municipal review.');
	const [firstSubmission] = await sql`select resolved_image_path from reports where id = ${reportId}`;
	const reviewer = await browser.newContext({ baseURL: origin });
	try {
		expectRedirect(await login(reviewer.request, accounts[1]), '/community');
		const review = async (decision: string, notes: string, expectedImage?: string) => {
			const [current] = await sql`select resolved_image_path from reports where id = ${reportId}`;
			return reviewer.request.post('/dashboard?/review', {
				headers: { Origin: origin, Accept: 'text/html' }, maxRedirects: 0,
				form: { reportId, decision, notes, expectedImage: expectedImage ?? current.resolved_image_path }
			});
		};
		const withoutVersion = await reviewer.request.post('/dashboard?/review', {
			headers: { Origin: origin, Accept: 'text/html' }, maxRedirects: 0,
			form: { reportId, decision: 'approve', notes: 'Missing evidence version must not approve this repair.' }
		});
		expect(withoutVersion.status()).toBe(409);
		await assertStatus('AWAITING_REVIEW');
		expect((await review('return', 'Please improve edge compaction and upload another photo.')).status()).toBe(200);
		await assertStatus('IN_REPAIR');
		await upload('Edges repaired and new after-photo submitted for review.');
		const [resubmitted] = await sql`select resolved_image_path from reports where id = ${reportId}`;
		expect(resubmitted.resolved_image_path).not.toBe(firstSubmission.resolved_image_path);
		expect((await review('approve', 'Old browser form must not approve evidence it never displayed.', firstSubmission.resolved_image_path)).status()).toBe(409);
		await assertStatus('AWAITING_REVIEW');
		expect((await review('approve', 'Repair evidence reviewed and accepted by the inspector.')).status()).toBe(200);
		await assertStatus('RESOLVED');
		expect((await review('approve', 'Repeated stale approval must not create another event.')).status()).toBe(409);
	} finally { await reviewer.close(); }

	const [saved] = await sql`select repair_notes, reviewed_by, submitted_at from work_orders where report_id = ${reportId}`;
	expect(saved.repair_notes).toBe('Edges repaired and new after-photo submitted for review.');
	expect(saved.reviewed_by).toBe(accounts[1].id);
	expect(saved.submitted_at).not.toBeNull();
	const events = await sql`select actor_id, image_path from work_order_events where report_id = ${reportId}`;
	expect(events.length).toBeGreaterThanOrEqual(7);
	expect(events.filter((event) => event.image_path)).toHaveLength(2);
	expect(events.every((event) => accounts.some((account) => account.id === event.actor_id))).toBe(true);
	await page.reload();
	await expect(detail).toContainText(/resolved/i);
	await expect(page.getByRole('region', { name: 'Activity', exact: true })).toContainText('Repair evidence reviewed and accepted');

	for (const [width, height] of [[1440, 900], [375, 812], [320, 740]]) {
		await page.setViewportSize({ width, height });
		expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
		await page.screenshot({ path: `.svelte-kit/review/government-${width}.png`, fullPage: true, animations: 'disabled' });
	}
	await page.evaluate(() => document.documentElement.classList.add('dark'));
	await page.screenshot({ path: '.svelte-kit/review/government-dark-mobile.png', fullPage: true, animations: 'disabled' });
	await page.evaluate(() => document.documentElement.classList.remove('dark'));
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.pdf({ path: '.svelte-kit/review/government-record.pdf', format: 'A4', printBackground: true });

	const downloadPromise = page.waitForEvent('download');
	await page.getByRole('link', { name: 'Export CSV', exact: true }).click();
	const download = await downloadPromise;
	expect(download.suggestedFilename()).toMatch(/\.csv$/);
	const downloadedPath = await download.path();
	expect(downloadedPath).not.toBeNull();
	const csv = await fs.readFile(downloadedPath!, 'utf8');
	expect(csv).toContain(reportId);
	expect(csv).toContain(title);
	expect(csv).toContain('RESOLVED');
	expect(csv).toContain('Presentation road crew');

	const citizen = await browser.newContext({ baseURL: origin });
	try {
		expectRedirect(await login(citizen.request, accounts[3]), '/community');
		const view = await citizen.newPage();
		await view.goto(`/map?report=${reportId}`);
		await expect(view.getByRole('region', { name: 'Hazard details', exact: true })).toContainText(/resolved/i);
		expectRedirect(await citizen.request.post('/dashboard?/assign', { headers: { Origin: origin, Accept: 'text/html' }, maxRedirects: 0, form: { reportId, crew: 'Unauthorized crew' } }), '/community');
		await assertStatus('RESOLVED');
	} finally { await citizen.close(); }
});

test('approval requires a stored after-photo even if the report already says awaiting review', async ({ request }) => {
	expectRedirect(await login(request), '/community');
	const response = await request.post('/dashboard?/review', {
		headers: { Origin: origin, Accept: 'text/html' }, maxRedirects: 0,
		form: { reportId: reportIds[1], decision: 'approve', notes: 'Cannot approve when no repair photo was saved.' }
	});
	expect(response.status()).toBeGreaterThanOrEqual(400);
	expect(response.status()).toBeLessThan(500);
	const [report] = await sql`select status, resolved_image_path from reports where id = ${reportIds[1]}`;
	expect(report.status).toBe('AWAITING_REVIEW');
	expect(report.resolved_image_path).toBeNull();
});

test('native assignment keeps the selected report after submitting without JavaScript', async ({ browser }) => {
	const reportId = reportIds[2];
	const context = await browser.newContext({ baseURL: origin, javaScriptEnabled: false });
	try {
		expectRedirect(await login(context.request), '/community');
		const page = await context.newPage();
		await page.goto(`/dashboard?report=${reportId}`);
		const detail = page.getByRole('region', { name: 'Work order details', exact: true });
		await expect(detail.getByRole('heading', { name: nativeTitle, exact: true })).toBeVisible();
		await page.getByLabel('Crew', { exact: true }).fill('Native fallback crew');
		await page.getByRole('button', { name: 'Assign crew', exact: true }).click();
		await expect(page).toHaveURL((url) => url.pathname === '/dashboard' && url.searchParams.get('report') === reportId);
		await expect(detail.getByRole('heading', { name: nativeTitle, exact: true })).toBeVisible();
		await expect(page.getByLabel('Crew', { exact: true })).toHaveValue('Native fallback crew');
		const [saved] = await sql`select reports.status, work_orders.assigned_crew from reports join work_orders on work_orders.report_id = reports.id where reports.id = ${reportId}`;
		expect(saved.status).toBe('DISPATCHED');
		expect(saved.assigned_crew).toBe('Native fallback crew');
	} finally { await context.close(); }
});
