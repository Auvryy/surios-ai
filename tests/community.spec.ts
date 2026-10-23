import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import postgres from 'postgres';
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const origin = 'http://127.0.0.1:5177';
const sql = postgres(process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5433/surios', { max: 1 });
const draftIds: string[] = [];
const files: string[] = [];
const sessionIds: string[] = [];
const analysis = { isValidInfrastructure: true, rejectionReason: null, distressType: 'pothole', hazardSeverity: 8, riskLevel: 'CRITICAL', vruLethality: 'HIGH', vruDetails: 'Sharp lip can deflect a motorcycle wheel.', estimatedDimensions: { depthEstimate: 'Approximate; inspect on site', surfaceAreaEstimate: 'Approximate; inspect on site' }, recommendedAction: 'Inspect and patch the affected surface.', materialsChecklist: ['Asphalt', 'Traffic cones'], urgency: 'PRIORITY', summary: 'Road surface damage presents a rider hazard.' };
async function login(api: APIRequestContext, email = 'citizen@surios.gov') {
	await api.post('/login', { headers: { Origin: origin }, form: { email, password: 'Password123!' } });
	const token = (await api.storageState()).cookies.find((cookie) => cookie.name === 'surios_session')?.value;
	if (token) sessionIds.push(token);
}
async function makeDraft(page: Page) {
	const [user] = await sql`select id from users where email = 'citizen@surios.gov'`;
	const draftId = randomUUID(); draftIds.push(draftId);
	const video = await page.evaluate(async () => {
		const canvas = document.createElement('canvas'); canvas.width = 160; canvas.height = 90;
		const context = canvas.getContext('2d')!;
		const stream = canvas.captureStream(10), chunks: Blob[] = [];
		const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
		const done = new Promise<number[]>((resolve) => recorder.onstop = async () => resolve([...new Uint8Array(await new Blob(chunks).arrayBuffer())]));
		recorder.ondataavailable = (event) => chunks.push(event.data); recorder.start();
		for (let frame = 0; frame < 15; frame++) { context.fillStyle = frame % 2 ? '#777' : '#555'; context.fillRect(0, 0, 160, 90); await new Promise((resolve) => setTimeout(resolve, 70)); }
		recorder.stop(); const bytes = await done; stream.getTracks().forEach((track) => track.stop()); return bytes;
	});
	const sources = [
		{ name: 'front.jpg', mimeType: 'image/jpeg', kind: 'photo', buffer: await fs.readFile('static/samples/pothole-severe.jpg'), extension: 'jpg' },
		{ name: 'side.jpg', mimeType: 'image/jpeg', kind: 'photo', buffer: await fs.readFile('static/samples/alligator-fatigue.jpg'), extension: 'jpg' },
		{ name: 'road.webm', mimeType: 'video/webm', kind: 'video', buffer: Buffer.from(video), extension: 'webm' }
	];
	await fs.mkdir('static/uploads/community', { recursive: true });
	const media = [];
	for (const source of sources) { const id = randomUUID(), filename = path.join('static/uploads/community', `${id}.${source.extension}`); files.push(filename); await fs.writeFile(filename, source.buffer); media.push({ id, url: `/media/${id}.${source.extension}`, name: source.name, mimeType: source.mimeType, kind: source.kind }); }
	await sql`insert into community_drafts (id, user_id, media, analysis, expires_at) values (${draftId}, ${user.id}, ${sql.json(media)}, ${sql.json(analysis)}, ${new Date(Date.now() + 3600000)})`;
	return { draftId, media, analysis, sources };
}

test.afterAll(async () => {
	if (draftIds.length) await sql.begin(async (tx) => {
		const posts = await tx`delete from community_posts where draft_id in ${sql(draftIds)} returning report_id`;
		await tx`delete from report_observations where source_id in ${sql(draftIds)}`;
		for (const reportId of new Set(posts.map((post) => post.report_id))) {
			await tx`delete from reports r where r.id = ${reportId} and not exists (select 1 from community_posts p where p.report_id = r.id) and not exists (select 1 from report_observations o where o.report_id = r.id) and coalesce((r.triage_payload->>'supportBaseline')::int, 0) = 0`;
		}
		await tx`delete from community_drafts where id in ${sql(draftIds)}`;
	});
	await Promise.all(files.map((file) => fs.rm(file, { force: true })));
	if (sessionIds.length) await sql`delete from sessions where id in ${sql(sessionIds)}`;
	await sql.end();
});

test('rejects unauthenticated requests, unsafe origins, and invalid files before AI', async ({ request: api }) => {
	const unauthenticated = await api.post('/api/community/assess', { headers: { Origin: origin }, multipart: {} });
	expect(unauthenticated.status()).toBe(401);
	await login(api);
	expect((await api.post('/api/community/posts', { headers: { Origin: 'https://example.invalid' }, data: {} })).status()).toBe(403);
	expect((await api.post('/api/community/posts', { headers: { Origin: origin }, data: { draftId: 'bad' } })).status()).toBe(400);
	const invalid = await api.post('/api/community/assess', { headers: { Origin: origin }, multipart: { media: { name: 'fake.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('not an image') } } });
	expect(invalid.status()).toBe(400);
});

test('composer saves selected cover, media, report, confirmations, comments, and searchable posts (controlled AI response)', async ({ page }) => {
	await login(page.request);
	await page.goto('/community'); await page.waitForLoadState('networkidle');
	const draft = await makeDraft(page);
	await page.route('**/api/community/assess', (route) => route.fulfill({ status: 200, json: { draftId: draft.draftId, media: draft.media, analysis } }));
	const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message));
	await page.getByRole('button', { name: 'What’s happening on your road?', exact: true }).click();
	await page.getByLabel('Headline', { exact: true }).fill(`E2E road update ${draft.draftId}`);
	await page.getByLabel('What happened?', { exact: true }).fill('Road damage near the school gate.');
	await page.getByLabel('Attach media', { exact: true }).setInputFiles(draft.sources.map(({ name, mimeType, buffer }) => ({ name, mimeType, buffer })));
	await page.getByRole('button', { name: 'Use side.jpg as cover', exact: true }).click();
	await expect(page.getByRole('button', { name: 'Use side.jpg as cover', exact: true })).toHaveAttribute('aria-pressed', 'true');
	await page.getByRole('button', { name: 'Use road.webm as cover', exact: true }).click();
	await expect(page.getByLabel('Selected video cover', { exact: true })).toBeVisible();
	await page.getByRole('button', { name: 'Use side.jpg as cover', exact: true }).click();
	await page.getByRole('button', { name: 'Assess with AI', exact: true }).click();
	await expect(page.getByText('Severity 8/10', { exact: true })).toBeVisible();
	await page.getByLabel('Road or landmark', { exact: true }).fill('E2E Santa Cruz school gate');
	await expect(page.locator('.leaflet-container')).toBeVisible();
	const y = '123.4173';
	await page.getByLabel('Latitude', { exact: true }).fill('11.2813'); await page.getByLabel('Longitude', { exact: true }).fill(y);
	await page.getByRole('button', { name: 'Publish road update', exact: true }).click();
	await expect(page.getByRole('dialog')).toBeHidden();
	const article = page.locator('article').filter({ hasText: `E2E road update ${draft.draftId}` });
	await expect(article).toBeVisible();
	await expect(article.locator('.media-frame > button img')).toHaveAttribute('src', draft.media[1].url);
	await page.reload(); await page.waitForLoadState('networkidle'); await expect(article).toBeVisible();
	for (const viewport of [{ width: 1440, height: 900 }, { width: 768, height: 1024 }, { width: 375, height: 812 }, { width: 320, height: 740 }]) {
		await page.setViewportSize(viewport);
		expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(viewport.width);
		const frame = await article.locator('.media-frame').boundingBox(); expect(Math.abs(frame!.width / frame!.height - 4 / 3)).toBeLessThan(.02);
	}
	await article.getByRole('button', { name: 'Next media', exact: true }).click();
	await expect(article.getByRole('button', { name: 'Open all media', exact: true })).toHaveText('2 / 4');
	await article.getByRole('button', { name: 'Next media', exact: true }).click();
	const video = article.locator('video'); await expect(video).toBeVisible(); await video.evaluate(async (element) => { await element.play(); });
	await article.getByRole('button', { name: 'Open all media', exact: true }).click();
	await expect(page.getByRole('dialog').locator('video')).toBeVisible();
	expect(await video.evaluate((element) => element.paused)).toBe(true);
	await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toBeHidden();
	await article.getByRole('button', { name: 'Next media', exact: true }).click();
	await expect(article.locator('iframe')).toHaveAttribute('src', /marker=11.2813,123.4173/);
	const postId = (await article.getAttribute('id'))!.slice(5);
	await article.getByRole('button', { name: 'Confirm', exact: true }).click();
	await expect(article.getByRole('button', { name: 'Confirmed', exact: true })).toBeVisible();
	await article.getByRole('button', { name: 'Comment', exact: true }).click();
	await article.getByRole('textbox', { name: /Comment on/ }).fill('E2E persisted comment'); await article.getByRole('button', { name: 'Send comment' }).click();
	await expect(article.getByText('E2E persisted comment')).toBeVisible();
	await page.reload(); await page.waitForLoadState('networkidle'); await expect(article.getByRole('button', { name: 'Confirmed', exact: true })).toBeVisible();
	await article.getByRole('button', { name: 'Comment', exact: true }).click(); await expect(article.getByText('E2E persisted comment')).toBeVisible();
	await page.getByRole('searchbox', { name: 'Search community' }).fill(draft.draftId); await page.getByRole('button', { name: 'Search posts', exact: true }).click();
	await expect(page.locator('article')).toHaveCount(1); await page.reload(); await page.waitForLoadState('networkidle'); await expect(page.locator('article')).toHaveCount(1);
	await page.getByRole('combobox', { name: 'Media type' }).selectOption('video'); await expect(page.locator('article')).toHaveCount(1);
	await page.getByRole('button', { name: 'Critical', exact: true }).click(); await expect(page.locator('article')).toHaveCount(1);
	const range = await page.request.get(draft.media[2].url, { headers: { Range: 'bytes=0-31' } }); expect(range.status()).toBe(206); expect((await range.body()).length).toBe(32);
	// Publishing retries return the same post and do not create duplicate reports.
	const retry = await page.request.post('/api/community/posts', { headers: { Origin: origin }, data: { draftId: draft.draftId, coverId: draft.media[1].id, title: 'Retry title', body: '', locationName: 'E2E school gate', latitude: 11.2813, longitude: 123.4173 } });
	expect((await retry.json()).id).toBe(postId);
	const foundById = await page.request.get(`/api/community/posts?q=${postId}`); expect((await foundById.json()).total).toBe(1);
	const [saved] = await sql`select cover_id, report_id from community_posts where id = ${postId}`;
	expect(saved.cover_id).toBe(draft.media[1].id);
	const [report] = await sql`select community_confirmations from reports where id = ${saved.report_id}`; expect(report.community_confirmations).toBe(1);
	await page.goto('/liked'); await expect(page).toHaveURL(/tab=confirmed/);
	await page.setViewportSize({ width: 375, height: 812 }); await page.evaluate(() => document.documentElement.classList.add('dark'));
	await page.screenshot({ path: '.svelte-kit/review/persistent-feed-mobile-dark.png', fullPage: true });
	expect(errors).toEqual([]);
});

test('assessment failure keeps attachments and allows retry; removing cover chooses another', async ({ page }) => {
	await login(page.request); await page.goto('/community'); await page.waitForLoadState('networkidle');
	await page.route('**/api/community/assess', (route) => route.fulfill({ status: 503, json: { message: 'AI temporarily unavailable' } }));
	await page.getByRole('button', { name: 'What’s happening on your road?', exact: true }).click();
	await page.getByLabel('Attach media', { exact: true }).setInputFiles(['static/samples/pothole-severe.jpg', 'static/samples/alligator-fatigue.jpg']);
	await page.getByRole('button', { name: 'Assess with AI', exact: true }).click(); await expect(page.getByRole('alert')).toHaveText('AI temporarily unavailable');
	await expect(page.getByRole('button', { name: 'Use pothole-severe.jpg as cover', exact: true })).toBeVisible();
	await page.getByRole('button', { name: 'Remove pothole-severe.jpg', exact: true }).click();
	await expect(page.getByRole('button', { name: 'Use alligator-fatigue.jpg as cover', exact: true })).toHaveAttribute('aria-pressed', 'true');
	await page.setViewportSize({ width: 320, height: 740 });
	const dialog = await page.getByRole('dialog').boundingBox(); expect(dialog!.x).toBeGreaterThanOrEqual(0); expect(dialog!.x + dialog!.width).toBeLessThanOrEqual(320);
	const locationMap = page.locator('.leaflet-container'); await locationMap.scrollIntoViewIfNeeded();
	await locationMap.click({ position: { x: 100, y: 90 } });
	await expect(page.getByLabel('Latitude', { exact: true })).not.toHaveValue('14.2813');
	await page.context().grantPermissions(['geolocation'], { origin }); await page.context().setGeolocation({ latitude: 14.28, longitude: 121.42 });
	await page.getByRole('button', { name: 'Use my location', exact: true }).click();
	await expect(page.getByLabel('Latitude', { exact: true })).toHaveValue('14.28');
	await expect(page.getByLabel('Longitude', { exact: true })).toHaveValue('121.42');
});

test('video-only covers reach the report map and invalid or foreign drafts cannot publish', async ({ page }) => {
	await login(page.request); await page.goto('/community'); await page.waitForLoadState('networkidle');
	const draft = await makeDraft(page);
	const input = { draftId: draft.draftId, coverId: draft.media[2].id, title: `E2E video ${draft.draftId}`, body: 'Video-only road evidence', locationName: 'E2E video site', latitude: 11.3813, longitude: 123.5173 };
	const invalidCover = await page.request.post('/api/community/posts', { headers: { Origin: origin }, data: { ...input, coverId: randomUUID() } }); expect(invalidCover.status()).toBe(400);
	const other = await page.context().browser()!.newContext({ baseURL: origin });
	await login(other.request, 'inspector@surios.gov');
	expect((await other.request.post('/api/community/posts', { headers: { Origin: origin }, data: input })).status()).toBe(404); await other.close();
	await sql`update community_drafts set media = ${sql.json([draft.media[2]])} where id = ${draft.draftId}`;
	const published = await page.request.post('/api/community/posts', { headers: { Origin: origin }, data: input }); expect(published.status()).toBe(201);
	const { id } = await published.json(); await page.reload(); await page.waitForLoadState('networkidle');
	const article = page.locator(`#post-${id}`); await expect(article.locator('video source')).toHaveAttribute('src', draft.media[2].url);
	await article.getByRole('button', { name: 'Next media', exact: true }).click(); await expect(article.locator('iframe')).toBeVisible();
	const [post] = await sql`select report_id from community_posts where id = ${id}`;
	const [report] = await sql`select image_path from reports where id = ${post.report_id}`; expect(report.image_path).toBe(draft.media[2].url);
	const mapResponse = await page.request.get('/map'); const mapHtml = await mapResponse.text(); expect(mapResponse.status()).toBe(200); expect(mapHtml).toContain(draft.media[2].url);
	const range = await page.request.get(draft.media[2].url, { headers: { Range: 'bytes=999999999-' } }); expect(range.status()).toBe(416);
	const expired = await makeDraft(page); await sql`update community_drafts set expires_at = ${new Date(Date.now() - 60000)} where id = ${expired.draftId}`;
	expect((await page.request.post('/api/community/posts', { headers: { Origin: origin }, data: { ...input, draftId: expired.draftId, coverId: expired.media[0].id } })).status()).toBe(410);
});


test('nearby community posts share one map hazard and unique support without raising severity for reused media', async ({ page }) => {
	await login(page.request); await page.goto('/community'); await page.waitForLoadState('networkidle');
	const first = await makeDraft(page), second = await makeDraft(page);
	await sql`update community_drafts set media = ${sql.json([first.media[0]])} where id = ${first.draftId}`;
	const [inspector] = await sql`select id from users where email = 'inspector@surios.gov'`;
	await sql`update community_drafts set user_id = ${inspector.id}, media = ${sql.json([second.media[0]])}, analysis = ${sql.json({ ...analysis, hazardSeverity: 10 })} where id = ${second.draftId}`;
	const title = `Shared evidence ${first.draftId}`;
	const input = { draftId: first.draftId, coverId: first.media[0].id, title: `${title} A`, body: 'First view', locationName: 'Isolated shared hazard verification', latitude: 11.5, longitude: 123.6 };
	const published = await page.request.post('/api/community/posts', { headers: { Origin: origin }, data: input }); expect(published.status()).toBe(201);
	const one = await published.json(); expect(one.grouped).toBe(false);
	const other = await page.context().browser()!.newContext({ baseURL: origin }); await login(other.request, 'inspector@surios.gov');
	const repeated = await other.request.post('/api/community/posts', { headers: { Origin: origin }, data: { ...input, draftId: second.draftId, coverId: second.media[0].id, title: `${title} B`, body: 'A nearby confirmation', latitude: 11.50001 } }); expect(repeated.status()).toBe(201);
	const two = await repeated.json(); expect(two.reportId).toBe(one.reportId); expect(two.grouped).toBe(true); expect(two.severity).toBe(8); expect(two.support).toBe(2); expect(two.priority).toBe(8.25);
	await other.close();
	const feed = await page.request.get(`/api/community/posts?q=${first.draftId}`); expect((await feed.json()).total).toBe(2);
	await page.goto(`/map?report=${one.reportId}`); await page.waitForLoadState('networkidle');
	const details = page.getByRole('region', { name: 'Hazard details' }); await expect(details).toContainText(`${title} A`);
	await details.getByRole('button', { name: 'More details', exact: true }).click();
	await expect(details.getByRole('link', { name: new RegExp(`${title} B`) })).toBeVisible();
	await expect(details).toContainText('Repeated media does not increase severity.');
	await page.getByRole('button', { name: 'Close hazard details', exact: true }).click();
	await page.getByRole('button', { name: 'Filters', exact: true }).click(); await page.getByRole('textbox', { name: 'Search map reports' }).fill(first.draftId); await page.getByRole('button', { name: 'Show matching reports', exact: true }).click();
	await expect(page.getByRole('complementary', { name: 'Hazard report list' }).getByRole('button', { name: /Open hazard:/ })).toHaveCount(1);
});
