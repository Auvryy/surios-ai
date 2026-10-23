import { test, expect, type APIRequestContext } from '@playwright/test';
import postgres from 'postgres';
import { randomUUID, randomBytes } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const sql = postgres(process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5433/surios', { max: 1 });
const origin = 'http://127.0.0.1:5177';
const marker = `governmentquote${randomUUID().replaceAll('-', '')}`;
const accounts = ['ENGINEER', 'OFFICER', 'ADMIN', 'CITIZEN'].map(role => ({ id: randomUUID(), token: randomBytes(32).toString('hex'), role }));
const reports = [randomUUID(), randomUUID()];
const posts = [randomUUID(), randomUUID(), randomUUID()];
const photoId = randomUUID();
const media = [{ id: photoId, url: '/samples/pothole-severe.jpg', kind: 'photo', name: 'original.jpg', mimeType: 'image/jpeg' }];
const analysis = { isValidInfrastructure: true, distressType: 'pothole', hazardSeverity: 5, riskLevel: 'MODERATE', vruLethality: 'LOW', vruDetails: 'Inspect on site.', summary: 'Government quote test evidence.', recommendedAction: 'Inspect and repair.', materialsChecklist: [], estimatedDimensions: { depthEstimate: 'Unmeasured', surfaceAreaEstimate: 'Unmeasured' }, urgency: 'PRIORITY', headline: marker, civicAddress: 'Test Road' };
const pdf = Buffer.from('%PDF-1.4\n% test work instruction\n%%EOF');
let image: Buffer;
let resolvedId = '';
const headers = (index = 0) => ({ Origin: origin, Cookie: `surios_session=${accounts[index].token}` });
const budget = [{ label: 'Materials', amount: 2500.25 }, { label: 'Labor', amount: 1499.75 }, { label: 'Traffic control', amount: 1000 }];
async function publish(api: APIRequestContext, data: Record<string, unknown> = {}, index = 0) {
	return api.post('/api/community/reposts', { headers: headers(index), multipart: { id: randomUUID(), postId: posts[0], body: 'Government action and supporting evidence.', status: 'IN_PROGRESS', budget: JSON.stringify(budget), budgetType: 'ESTIMATED', evidence: { name: 'work instruction.pdf', mimeType: 'application/pdf', buffer: pdf }, ...data } as never });
}
async function state() { return (await sql`select status, hazard_severity, community_confirmations, (select count(*)::int from report_observations where report_id = ${reports[0]}) observations from reports where id = ${reports[0]}`)[0]; }

test.beforeAll(async () => {
	image = await fs.readFile('static/samples/pothole-severe.jpg');
	await sql.begin(async tx => {
		for (const account of accounts) {
			await tx`insert into users (id, name, email, role, password_hash, government_profile) values (${account.id}, ${`${marker} ${account.role}`}, ${`${account.id}@example.test`}, ${account.role}, 'unused', ${account.role === 'CITIZEN' ? null : tx.json({ level: 'MUNICIPAL', jurisdiction: 'Test Municipality', bio: 'Test office' })})`;
			await tx`insert into sessions (id, user_id, expires_at) values (${account.token}, ${account.id}, ${new Date(Date.now() + 86400000)})`;
		}
		for (const id of reports) await tx`insert into reports (id, image_path, latitude, longitude, distress_type, hazard_severity, risk_level, vru_lethality, recommended_action, community_confirmations, triage_payload) values (${id}, '/samples/pothole-severe.jpg', 14.28, 121.42, 'pothole', 5, 'MODERATE', 'LOW', 'Inspect and repair.', 2, ${tx.json(analysis)})`;
		for (const [index, id] of posts.entries()) await tx`insert into community_posts (id, user_id, draft_id, report_id, title, body, location_name, latitude, longitude, media, cover_id, analysis) values (${id}, ${accounts[3].id}, ${randomUUID()}, ${reports[index === 2 ? 1 : 0]}, ${`${marker} ${index}`}, 'A citizen road report.', 'Test Road', 14.28, 121.42, ${tx.json(media)}, ${photoId}, ${tx.json(analysis)})`;
	});
});
test.beforeEach(async () => {
	const rows = await sql`select government_update from community_reposts where user_id in ${sql(accounts.map(account => account.id))}`;
	for (const row of rows) for (const file of row.government_update?.attachments || []) await fs.rm(path.join('static/uploads/community', path.basename(file.url)), { force: true });
	await sql`delete from community_reposts where user_id in ${sql(accounts.map(account => account.id))}`;
	await sql`update reports set status = 'REPORTED', resolved_image_path = null where id in ${sql(reports)}`;
});
test.afterAll(async () => {
	const updates = await sql`select government_update from community_reposts where user_id in ${sql(accounts.map(account => account.id))}`;
	for (const row of updates) for (const file of row.government_update?.attachments || []) await fs.rm(path.join('static/uploads/community', path.basename(file.url)), { force: true });
	await sql.begin(async tx => {
		await tx`delete from community_posts where id in ${sql(posts)}`;
		await tx`delete from reports where id in ${sql(reports)}`;
		await tx`delete from users where id in ${sql(accounts.map(account => account.id))}`;
	});
	await sql.end();
});

for (const [index, role] of ['ENGINEER', 'OFFICER', 'ADMIN'].entries()) test(`${role} has one minimal government page with no crew assignment or estimator`, async ({ page, baseURL }) => {
	await page.context().addCookies([{ name: 'surios_session', value: accounts[index].token, url: baseURL! }]);
	await page.goto(`/dashboard?q=${marker}`);
	await expect(page.getByRole('heading', { name: 'Government updates', exact: true })).toBeVisible();
	const nav = page.getByRole('navigation', { name: 'Main navigation', exact: true });
	await expect(nav.getByRole('link')).toHaveCount(7);
	await expect(nav.getByRole('link', { name: 'Government updates', exact: true })).toHaveAttribute('aria-current', 'page');
	for (const name of ['Feed', 'Road hazards', 'Report a hazard', 'Confirmed updates', 'Account', 'Settings']) await expect(nav.getByRole('link', { name, exact: true })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Assign crew' })).toHaveCount(0);
	await expect(page.getByText('Material estimate', { exact: true })).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Post government update', exact: true })).toHaveCount(2);
	for (const route of ['/verification', '/analytics', '/crews', '/docs']) {
		const response = await page.request.get(route, { maxRedirects: 0 }); expect(response.status()).toBe(303); expect(response.headers().location).toBe('/dashboard');
	}
});

test('publishing progress in the UI persists PDF evidence and a budget without increasing hazard support', async ({ page, baseURL }) => {
	const before = await state();
	await page.context().addCookies([{ name: 'surios_session', value: accounts[0].token, url: baseURL! }]);
	await page.goto(`/community/post/${posts[0]}`); await page.waitForLoadState('networkidle');
	await page.getByRole('button', { name: 'Update', exact: true }).click();
	await page.getByLabel('Repost text', { exact: true }).fill('Maintenance has been instructed; supporting document attached.');
	await page.getByLabel('Government evidence', { exact: true }).setInputFiles({ name: 'instruction.pdf', mimeType: 'application/pdf', buffer: pdf });
	await page.getByText('Budget breakdown', { exact: false }).click();
	for (const [index, item] of budget.entries()) {
		await page.getByRole('button', { name: 'Add budget item', exact: true }).click();
		await page.getByLabel(`Budget item ${index + 1}`, { exact: true }).fill(item.label);
		await page.getByLabel(`Budget amount ${index + 1}`, { exact: true }).fill(String(item.amount));
	}
	await page.getByRole('button', { name: 'Publish update', exact: true }).click();
	await expect(page).toHaveURL(/\?repost=/);
	const id = new URL(page.url()).searchParams.get('repost')!;
	const quote = page.locator(`#repost-${id}`);
	await expect(quote.getByRole('link', { name: 'In progress', exact: true })).toBeVisible();
	await expect(quote.getByRole('img', { name: 'Quoted original report', exact: true })).toHaveAttribute('src', media[0].url);
	await quote.getByText('Estimated budget · ₱5,000.00', { exact: true }).click();
	await expect(quote.getByText('Materials', { exact: true })).toBeVisible();
	const fileUrl = await quote.getByRole('link', { name: /Download PDF/ }).getAttribute('href');
	const file = await page.request.get(fileUrl!); expect(file.status()).toBe(200); expect(file.headers()['content-type']).toBe('application/pdf'); expect(file.headers()['content-disposition']).toBe('attachment');
	await page.reload(); await expect(quote).toBeVisible();
	const after = await state(); expect(after).toEqual({ ...before, status: 'IN_REPAIR' });
	for (const post of posts.slice(0, 2)) {
		await page.goto(`/community?q=${post}`);
		await expect(page.locator(`#post-${post} [data-report-status]`)).toHaveAttribute('data-report-status', 'IN_REPAIR');
		await expect(page.locator(`#post-${post} [data-report-status]`)).toHaveAttribute('href', `/community/post/${posts[0]}?repost=${id}#repost-${id}`);
	}
});

test('resolution closes all posts for one pothole and every badge links to the government explanation', async ({ request, page }) => {
	const response = await publish(request, { status: 'RESOLVED', budgetType: 'ACTUAL', body: 'Repair completed and road surface checked. Evidence attached.', evidence: { name: 'completed.jpg', mimeType: 'image/jpeg', buffer: image } });
	expect(response.status()).toBe(201); resolvedId = (await response.json()).id;
	for (const post of posts.slice(0, 2)) {
		await page.goto(`/community?q=${post}`);
		const badge = page.locator(`#post-${post} [data-report-status]`);
		await expect(badge).toHaveAttribute('data-report-status', 'RESOLVED');
		await badge.click();
		await expect(page).toHaveURL(new RegExp(`/community/post/${posts[0]}\\?repost=${resolvedId}`));
		const quote = page.locator(`#repost-${resolvedId}`);
		await expect(quote.getByText('Repair completed and road surface checked. Evidence attached.', { exact: true })).toBeVisible();
		await expect(quote.getByRole('link', { name: /Open evidence photo/ })).toBeVisible();
		await expect(page.locator(`#post-${posts[0]}`)).toHaveCount(0); // government content stays prominent
	}
	await page.goto(`/community/post/${posts[1]}`);
	await expect(page.locator(`#repost-${resolvedId}`)).toBeVisible();
	await page.goto(`/community?q=${posts[2]}`); await expect(page.locator('[data-report-status]')).toHaveCount(0);
	const [unrelated] = await sql`select status from reports where id = ${reports[1]}`; expect(unrelated.status).toBe('REPORTED');
	await page.goto(`/map?report=${reports[0]}`); await expect(page.getByText('Resolved', { exact: true })).toBeVisible();
	await page.context().addCookies([{ name: 'surios_session', value: accounts[0].token, url: origin }]);
	await page.goto(`/community/post/${posts[0]}`); await page.waitForLoadState('networkidle');
	await page.getByRole('button', { name: 'Update', exact: true }).click();
	await expect(page.getByLabel('Report status', { exact: true })).toHaveValue('RESOLVED');

});

test('government profile shows distinct resolved/in-progress reports, not number of update posts', async ({ page, request }) => {
	expect((await publish(request)).status()).toBe(201); expect((await publish(request, { status: 'RESOLVED' })).status()).toBe(201);
	await page.goto(`/community?profile=${accounts[0].id}`);
	const stats = page.getByRole('definition');
	await expect(page.getByText('Municipal office · Test Municipality', { exact: true })).toBeVisible();
	await expect(stats).toHaveText(['1', '0', '1']);
	await expect(page.locator('[data-repost-id]')).toHaveCount(2);
});

test('citizens and guests cannot publish official status or office identity and retired actions cannot change status', async ({ request }) => {
	const before = await state();
	expect((await publish(request, {}, 3)).status()).toBe(403);
	const anonymous = await request.post('/api/community/reposts', { headers: { Origin: origin, Cookie: '' }, multipart: { id: randomUUID(), postId: posts[0], status: 'RESOLVED' } }); expect(anonymous.status()).toBe(401);
	const badOrigin = await request.post('/api/community/reposts', { headers: { ...headers(), Origin: 'https://example.test' }, multipart: { id: randomUUID(), postId: posts[0], status: 'RESOLVED' } }); expect(badOrigin.status()).toBe(403);
	const profile = await request.post('/api/profile', { headers: headers(3), multipart: { name: 'Fake municipal office', governmentLevel: 'MUNICIPAL', jurisdiction: 'Anywhere' } }); expect(profile.status()).toBe(403);
	const legacy = await request.post('/dashboard?/assign', { headers: { ...headers(), Accept: 'text/html' }, form: { reportId: reports[0], crew: 'Retired control' } }); expect(legacy.status()).toBe(405);
	const access = await request.get('/dashboard', { headers: headers(3), maxRedirects: 0 }); expect(access.status()).toBe(303);
	expect(await state()).toEqual(before);
});

test('invalid budgets, missing evidence and spoofed documents are rejected without changing any linked status', async ({ request }) => {
	const before = await state();
	for (const data of [
		{ budget: 'not-json' }, { budget: JSON.stringify([{ label: 'Bad', amount: -10 }]) },
		{ budget: JSON.stringify([{ label: '', amount: 10 }]) }, { budget: JSON.stringify([{ label: 'Bad', amount: 1.234 }]) },
		{ budget: JSON.stringify([{ label: 'Huge', amount: 1e100 }]) }, { body: '' }, { status: 'FAKE' },
		{ evidence: '' }, { evidence: { name: 'spoof.pdf', mimeType: 'application/pdf', buffer: Buffer.from('<html>not a PDF</html>') } },
		{ evidence: { name: 'spoof.png', mimeType: 'image/png', buffer: pdf } },
		{ evidence: { name: 'large.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(4 * 1024 * 1024 + 1) } }
	]) { const response = await publish(request, data); expect([400, 413]).toContain(response.status()); }
	expect(await state()).toEqual(before);
});

test('retries keep one official update and public history cannot be undone', async ({ request }) => {
	const id = randomUUID();
	const first = await publish(request, { id, postId: posts[1], status: 'RESOLVED' }); expect(first.status()).toBe(201);
	const [saved] = await sql`select government_update from community_reposts where id = ${id}`;
	const retry = await publish(request, { id, postId: posts[1], status: 'IN_PROGRESS' }); expect(retry.status()).toBe(201);
	const rows = await sql`select government_update from community_reposts where id = ${id}`; expect(rows).toHaveLength(1); expect(rows[0].government_update).toEqual(saved.government_update);
	expect((await state()).status).toBe('RESOLVED');
	const remove = await request.delete(`/api/community/reposts?id=${id}`, { headers: headers() }); expect(remove.status()).toBe(404);
	const unauthorizedRetry = await publish(request, { id, postId: posts[1] }, 1); expect(unauthorizedRetry.status()).toBe(409);
});

test('municipal and barangay profile details persist publicly and stay readable on mobile', async ({ page, baseURL }) => {
	await page.context().addCookies([{ name: 'surios_session', value: accounts[1].token, url: baseURL! }]);
	await page.goto('/profile'); await page.waitForLoadState('networkidle'); await page.getByRole('button', { name: 'Edit profile', exact: true }).click();
	await page.getByLabel('Government level', { exact: true }).selectOption('BARANGAY');
	await page.getByLabel('Jurisdiction', { exact: true }).fill('Barangay Sample, Santa Cruz');
	await page.getByLabel('About this office', { exact: true }).fill('Public road maintenance updates for our barangay.');
	await page.getByRole('button', { name: 'Save changes', exact: true }).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await page.goto(`/community?profile=${accounts[1].id}`);
	await expect(page.getByText('Barangay office · Barangay Sample, Santa Cruz', { exact: true })).toBeVisible();
	await expect(page.getByText('Public road maintenance updates for our barangay.', { exact: true })).toBeVisible();
	for (const width of [320, 375, 768, 1440]) { await page.setViewportSize({ width, height: 900 }); expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width); }
});

test('later office updates transfer report attribution and concurrent updates agree with shared status', async ({ request, page }) => {
	const results = await Promise.all([publish(request, { status: 'RESOLVED' }, 1), publish(request, { status: 'IN_PROGRESS', postId: posts[1] }, 2)]);
	for (const response of results) expect(response.status()).toBe(201);
	const [latest] = await sql`select q.user_id, q.government_update->>'status' status, q.id, q.post_id from community_reposts q join community_posts p on p.id = q.post_id where p.report_id = ${reports[0]} and q.government_update is not null order by q.created_at desc, q.id desc limit 1`;
	expect((await state()).status).toBe(latest.status === 'RESOLVED' ? 'RESOLVED' : 'IN_REPAIR');
	for (const [index, account] of accounts.slice(0, 3).entries()) {
		await page.goto(`/community?profile=${account.id}`);
		const mine = latest.user_id === account.id;
		await expect(page.getByRole('definition')).toHaveText([mine ? '1' : '0', mine && latest.status === 'IN_PROGRESS' ? '1' : '0', mine && latest.status === 'RESOLVED' ? '1' : '0']);
	}
});

test('multiple evidence files stay prominent, limits are enforced and exports contain budget breakdowns', async ({ request, page, baseURL }) => {
	const send = async (count: number) => {
		const form = new FormData(); form.set('id', randomUUID()); form.set('postId', posts[0]); form.set('body', '=Sample office update with multiple evidence files'); form.set('status', 'RESOLVED'); form.set('budget', JSON.stringify(budget)); form.set('budgetType', 'ACTUAL');
		for (let i = 0; i < count; i++) form.append('evidence', new File([i === 0 ? image : pdf], i === 0 ? 'repair.jpg' : `document-${i}.pdf`, { type: i === 0 ? 'image/jpeg' : 'application/pdf' }));
		return request.post('/api/community/reposts', { headers: headers(), multipart: form });
	};
	expect((await send(5)).status()).toBe(400); expect((await state()).status).toBe('REPORTED');
	const response = await send(4); expect(response.status()).toBe(201); const id = (await response.json()).id;
	await page.goto(`/community/post/${posts[0]}?repost=${id}`); await page.waitForLoadState('networkidle');
	const quote = page.locator(`#repost-${id}`); await expect(quote.getByRole('link', { name: /Download PDF/ })).toHaveCount(3);
	await expect(quote.getByRole('img', { name: 'repair.jpg', exact: true })).toBeVisible();
	await expect(quote.getByRole('img', { name: 'Quoted original report', exact: true })).toBeVisible();
	await quote.getByText('Actual expenditure · ₱5,000.00', { exact: true }).click();
	for (const width of [320, 375, 768, 1440]) { await page.setViewportSize({ width, height: 900 }); expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width); }
	await page.setViewportSize({ width: 375, height: 900 }); await page.screenshot({ path: '.svelte-kit/government-update-mobile.png', fullPage: true });
	await page.context().addCookies([{ name: 'surios_session', value: accounts[0].token, url: baseURL! }]);
	const exported = await page.request.get('/dashboard/export'); expect(exported.status()).toBe(200);
	const csv = await exported.text(); expect(csv).toContain('Budget breakdown'); expect(csv).toContain('Materials: 2500.25'); expect(csv).toContain('"5000"'); expect(csv).toContain("'=Sample office update"); expect(csv).not.toContain('Assigned crew');
});

test('photo filters include government repair evidence even when the quoted report has only video', async ({ request, page }) => {
	const id = randomUUID();
	await sql`update community_posts set media = ${sql.json([{ id, url: '/samples/test.webm', kind: 'video', name: 'Road video.webm', mimeType: 'video/webm' }])}, cover_id = ${id} where id = ${posts[2]}`;
	const response = await publish(request, { postId: posts[2], budget: '[]', evidence: { name: 'work.jpg', mimeType: 'image/jpeg', buffer: image } });
	expect(response.status()).toBe(201); const quoteId = (await response.json()).id;
	await page.goto(`/community?q=${posts[2]}&media=photo`);
	await expect(page.locator(`#repost-${quoteId}`)).toBeVisible();
	await expect(page.locator(`#repost-${quoteId}`).getByRole('img', { name: 'work.jpg', exact: true })).toBeVisible();
	await expect(page.locator(`#post-${posts[2]}`)).toHaveCount(0);
});
