import { test, expect, type APIRequestContext } from '@playwright/test';
import postgres from 'postgres';
import { randomBytes, randomUUID } from 'node:crypto';

const sql = postgres(process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5433/surios', { max: 1 });
const marker = `searchfixture${randomUUID().replaceAll('-', '')}`;
const author = randomUUID(), supporter = randomUUID(), report = randomUUID();
const ids = Array.from({ length: 25 }, () => randomUUID());
const reportIds = ids.map((_, index) => index ? randomUUID() : report);
const session = randomBytes(32).toString('hex');
const drafts = ids.map(() => randomUUID());
const analysis = { isValidInfrastructure: true, distressType: 'pothole', hazardSeverity: 4, riskLevel: 'MODERATE', vruLethality: 'LOW', vruDetails: 'Test fixture', estimatedDimensions: { depthEstimate: 'Test', surfaceAreaEstimate: 'Test' }, recommendedAction: 'Inspect', materialsChecklist: [], urgency: 'ROUTINE', summary: 'Test fixture' };

test.beforeAll(async () => {
	await sql.begin(async (tx) => {
		await tx`insert into users (id, email, name, password_hash) values (${author}, ${`${marker}@example.test`}, ${`Mara Santos ${marker}`}, 'unused-test-hash'), (${supporter}, ${`${marker}-support@example.test`}, 'Search supporter', 'unused-test-hash')`;
		for (const [index, id] of ids.entries()) {
			const titles = ['School pothole', 'Inspection notes', 'Rizal drainage obstruction', 'Surface repair update'];
			const bodies = ['Broken asphalt outside the gate.', 'School pothole needs inspection.', 'Water pools outside the market.', 'Long narrow damage along the lane.'];
			const severity = [4, 9, 8, 3][index] || 2;
			// Distinct damage types/severities represent distinct canonical hazards.
			await tx`insert into reports(id,image_path,latitude,longitude,distress_type,hazard_severity,risk_level,vru_lethality,recommended_action) values(${reportIds[index]},'/samples/pothole-severe.jpg',14.28,121.42,'pothole',${severity},${severity >= 8 ? 'CRITICAL' : severity >= 4 ? 'MODERATE' : 'LOW'},'LOW','Test fixture')`;
			const kind = index === 2 ? 'video' : 'photo';
			const media = [{ id: randomUUID(), kind, url: kind === 'photo' ? '/samples/pothole-severe.jpg' : '/samples/test.webm', name: 'Search fixture', mimeType: kind === 'photo' ? 'image/jpeg' : 'video/webm' }];
			await tx`insert into community_posts (id, user_id, draft_id, report_id, title, body, location_name, latitude, longitude, media, cover_id, analysis, created_at) values (${id}, ${author}, ${drafts[index]}, ${reportIds[index]}, ${titles[index] || `Routine pavement check ${index}`}, ${`${bodies[index] || 'Routine inspection.'} ${marker}`}, ${index === 0 || index === 2 ? 'Rizal Street' : 'Municipal plaza'}, 14.28, 121.42, ${sql.json(media)}, ${media[0].id}, ${sql.json({ ...analysis, hazardSeverity: severity, distressType: index === 2 ? 'drainage_culvert_failure' : index === 3 ? 'longitudinal_transverse_cracking' : index > 3 ? 'ravelling_weathering' : 'pothole' })}, ${new Date(Date.UTC(2025, 0, index + 1))})`;
		}
		await tx`insert into community_confirmations (post_id, user_id) values (${ids[0]}, ${author}), (${ids[0]}, ${supporter}), (${ids[1]}, ${supporter})`;
		await tx`insert into sessions (id, user_id, expires_at) values (${session}, ${author}, ${new Date(Date.now() + 86400000)})`;
	});
});

test.afterAll(async () => {
	await sql.begin(async (tx) => {
		await tx`delete from community_posts where id in ${sql(ids)}`;
		await tx`delete from reports where id in ${sql(reportIds)}`;
		await tx`delete from users where id in ${sql([author, supporter])}`;
	});
	await sql.end();
});

async function search(api: APIRequestContext, q: string, params: Record<string, string> = {}) {
	const response = await api.get(`/api/community/posts?${new URLSearchParams({ q, ...params })}`);
	expect(response.status()).toBe(200);
	return response.json();
}

test('matches reordered words across fields, stems hazard names, and ranks titles above body matches', async ({ request }) => {
	const result = await search(request, `  SCHOOL   near potholes ${marker}  `);
	expect(result.posts.map((post: { id: string }) => post.id)).toEqual([ids[0], ids[1]]);
	expect(result.filters.q).toBe(`SCHOOL near potholes ${marker}`);
	expect(result.filters.sort).toBe('relevance');
	expect((await search(request, `potholes school ${marker}`)).posts.map((post: { id: string }) => post.id)).toEqual([ids[0], ids[1]]);
	expect((await search(request, `riza mar ${marker}`)).total).toBe(2);
	expect((await search(request, `rizal mara ${marker}`)).posts.map((post: { id: string }) => post.id)).toEqual(expect.arrayContaining([ids[0], ids[2]]));
	expect((await search(request, `cracks ${marker}`)).posts.map((post: { id: string }) => post.id)).toEqual([ids[3]]);
	expect((await search(request, `drainage culvert ${marker}`)).posts.map((post: { id: string }) => post.id)).toEqual([ids[2]]);
	expect((await search(request, `${marker} impossibleword`)).total).toBe(0);
});

test('sorts the entire matching dataset and combines media, severity and contributor filters', async ({ request }) => {
	for (const [sort, order] of [['newest', [ids[1], ids[0]]], ['oldest', [ids[0], ids[1]]], ['severity', [ids[1], ids[0]]], ['confirmations', [ids[0], ids[1]]]] as const) {
		expect((await search(request, `school potholes ${marker}`, { sort })).posts.map((post: { id: string }) => post.id)).toEqual(order);
	}
	expect((await search(request, marker, { tab: 'critical', media: 'photo', author })).posts.map((post: { id: string }) => post.id)).toEqual([ids[1]]);
	expect((await search(request, marker, { tab: 'critical', media: 'video' })).posts.map((post: { id: string }) => post.id)).toEqual([ids[2]]);
	expect((await search(request, marker, { tab: 'confirmed' })).total).toBe(0);
	expect((await search(request, marker, { sort: 'injection' })).filters.sort).toBe('relevance');
});

test('keeps exact post, report and assessment links searchable and treats wildcard characters literally', async ({ request }) => {
	for (const q of [ids[0], ids[0].toUpperCase(), drafts[0]]) expect((await search(request, q)).posts.map((post: { id: string }) => post.id)).toEqual([ids[0]]);
	expect((await search(request, report)).total).toBe(1);
	for (const q of [`${marker} %`, `${marker} _`, `${marker} \\`, `${marker} ' OR 1=1 --`, '!!!']) expect((await search(request, q)).total).toBe(0);
});

test('loads stable additional batches without losing sort or filters', async ({ request }) => {
	const first = await search(request, marker, { sort: 'oldest' });
	expect(first.posts.map((post: { id: string }) => post.id)).toEqual(ids.slice(0, 20));
	expect(first.total).toBe(25); expect(first.hasMore).toBe(true);
	const second = await search(request, marker, { sort: 'oldest', page: '2' });
	expect(second.posts.map((post: { id: string }) => post.id)).toEqual(ids);
	expect(second.hasMore).toBe(false);
});

test('legacy confirmed links show liked posts and ignore removed media filters', async ({ page, baseURL }) => {
	await page.context().addCookies([{ name: 'surios_session', value: session, url: baseURL! }]);
	expect((await search(page.request, marker, { tab: 'confirmed', sort: 'confirmations' })).posts.map((post: { id: string }) => post.id)).toEqual([ids[0]]);
	const liked = await search(page.request, marker, { tab: 'confirmed', media: 'video' });
	expect(liked.posts.map((post: { id: string }) => post.id)).toEqual([ids[0]]);
	expect(liked.filters.media).toBe('');
});

test('native search submission works without JavaScript and preserves active filters', async ({ browser, baseURL }) => {
	const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
	try {
		const page = await context.newPage();
		await page.goto('/community?media=photo&sort=oldest');
		await page.getByRole('searchbox', { name: 'Search community' }).fill(`school potholes ${marker}`);
		await page.getByRole('button', { name: 'Search posts', exact: true }).click();
		await expect(page).toHaveURL(/q=/);
		await expect(page.locator('article')).toHaveCount(2);
		await expect(page.getByLabel('Sort posts')).toHaveValue('oldest');
		await expect(page.getByLabel('Media type')).toHaveValue('photo');
		await expect(page.getByRole('button', { name: 'What’s happening with local infrastructure?', exact: true })).toHaveCount(0);
	} finally { await context.close(); }
});

test('hides the composer during results, persists sorting, restores it on clear, and fits mobile', async ({ page }) => {
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));
	await page.goto('/community');
	await page.waitForLoadState('networkidle');
	const composer = page.getByRole('button', { name: 'What’s happening with local infrastructure?', exact: true });
	await expect(composer).toBeVisible();
	await page.getByRole('searchbox', { name: 'Search community' }).fill(`school potholes ${marker}`);
	await page.getByRole('button', { name: 'Search posts', exact: true }).click();
	await expect(page).toHaveURL(/q=/);
	await expect(composer).toHaveCount(0);
	await expect(page.locator('article')).toHaveCount(2);
	await expect(page.locator('article').first()).toHaveAttribute('id', `post-${ids[0]}`);
	await expect(page.getByLabel('Sort posts')).toHaveValue('relevance');
	await page.getByLabel('Sort posts').selectOption('severity');
	await expect(page.locator('article').first()).toHaveAttribute('id', `post-${ids[1]}`);
	await page.reload();
	await page.waitForLoadState('networkidle');
	await expect(page.getByLabel('Sort posts')).toHaveValue('severity');
	await expect(composer).toHaveCount(0);
	for (const width of [320, 375, 768, 1440]) {
		await page.setViewportSize({ width, height: 900 });
		expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
	}
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.screenshot({ path: '.svelte-kit/review/community-search-desktop.png', fullPage: true });
	await page.getByLabel('Media type').selectOption('photo');
	await page.getByRole('button', { name: 'Clear search', exact: true }).click();
	await expect(composer).toBeVisible();
	await expect(page.getByLabel('Media type')).toHaveValue('photo');
	await expect(page.getByLabel('Sort posts')).toHaveValue('severity');
	await page.goto(`/community?q=${marker}&sort=oldest`);
	await page.waitForLoadState('networkidle');
	await expect(page.locator('article')).toHaveCount(20);
	await page.getByRole('button', { name: 'Load more updates' }).click();
	await expect(page.locator('article')).toHaveCount(25);
	await expect(page).toHaveURL(/page=2/);
	await page.getByLabel('Sort posts').selectOption('newest');
	await expect(page).not.toHaveURL(/page=/);
	await expect(page.locator('article').first()).toHaveAttribute('id', `post-${ids[24]}`);
	await page.goto(`/community?q=${marker}nothing`);
	await expect(page.getByRole('heading', { name: 'No matching updates' })).toBeVisible();
	await expect(composer).toHaveCount(0);
	expect(errors).toEqual([]);
});
