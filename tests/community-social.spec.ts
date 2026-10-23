import { test, expect, type APIRequestContext } from '@playwright/test';
import postgres from 'postgres';
import { randomBytes, randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const sql = postgres(process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5433/surios', { max: 1 });
const marker = `socialfixture${randomUUID().replaceAll('-', '')}`;
const owner = randomUUID(), neighbor = randomUUID(), report = randomUUID();
const posts = [randomUUID(), randomUUID()];
const comments = Array.from({ length: 4 }, () => randomUUID());
const session = randomBytes(32).toString('hex'), otherSession = randomBytes(32).toString('hex');
const media = [
	{ id: randomUUID(), url: '/samples/pothole-severe.jpg', kind: 'photo', name: 'Road front.jpg', mimeType: 'image/jpeg' },
	{ id: randomUUID(), url: '/samples/alligator-fatigue.jpg', kind: 'photo', name: 'Road side.jpg', mimeType: 'image/jpeg' }
];
const analysis = { isValidInfrastructure: true, rejectionReason: null, distressType: 'pothole', hazardSeverity: 8, riskLevel: 'CRITICAL', vruLethality: 'HIGH', vruDetails: 'Test fixture', estimatedDimensions: { depthEstimate: 'Test', surfaceAreaEstimate: 'Test' }, recommendedAction: 'Inspect', materialsChecklist: [], urgency: 'PRIORITY', summary: 'Test fixture' };
let photo: Buffer;

async function signIn(api: APIRequestContext, token = session) {
	// API contexts use the actual session cookie, without changing seeded users.
	return { Origin: test.info().project.use.baseURL as string, Cookie: `surios_session=${token}` };
}
async function repost(api: APIRequestContext, postId = posts[0], body = '', id = randomUUID()) {
	return api.post('/api/community/reposts', { headers: await signIn(api), multipart: { id, postId, body } });
}
async function reportState() {
	const [state] = await sql`select hazard_severity, community_confirmations, triage_payload, (select count(*)::int from community_posts where report_id = ${report}) as posts, (select count(*)::int from report_observations where report_id = ${report}) as observations from reports where id = ${report}`;
	return state;
}

test.beforeAll(async () => {
	photo = await fs.readFile('static/samples/pothole-severe.jpg');
	await sql.begin(async (tx) => {
		await tx`insert into users (id, email, name, password_hash) values (${owner}, ${`${marker}@example.test`}, 'Social fixture author', 'unused'), (${neighbor}, ${`${marker}-neighbor@example.test`}, 'Social fixture neighbor', 'unused')`;
		await tx`insert into sessions (id, user_id, expires_at) values (${session}, ${owner}, ${new Date(Date.now() + 86400000)}), (${otherSession}, ${neighbor}, ${new Date(Date.now() + 86400000)})`;
		await tx`insert into reports (id, image_path, latitude, longitude, distress_type, hazard_severity, risk_level, vru_lethality, recommended_action, community_confirmations, triage_payload) values (${report}, '/samples/pothole-severe.jpg', 14.28, 121.42, 'pothole', 8, 'CRITICAL', 'HIGH', 'Inspect', 2, ${sql.json(analysis)})`;
		for (const [index, id] of posts.entries()) await tx`insert into community_posts (id, user_id, draft_id, report_id, title, body, location_name, latitude, longitude, media, cover_id, analysis) values (${id}, ${index ? neighbor : owner}, ${randomUUID()}, ${report}, ${`${marker} road update ${index}`}, 'Independent observation of road damage.', 'Fixture Street', 14.28, 121.42, ${sql.json(media)}, ${media[0].id}, ${sql.json(analysis)})`;
		await tx`insert into community_comments (id, post_id, user_id, body, created_at) values (${comments[0]}, ${posts[0]}, ${owner}, 'First comment with a reply.', '2025-01-01'), (${comments[1]}, ${posts[0]}, ${neighbor}, 'Most popular comment.', '2025-01-02'), (${comments[3]}, ${posts[1]}, ${owner}, 'The only comment.', '2025-01-03')`;
		await tx`insert into community_comments (id, post_id, user_id, parent_id, body) values (${comments[2]}, ${posts[0]}, ${neighbor}, ${comments[0]}, 'Reply to first comment.')`;
		await tx`insert into community_comment_likes (comment_id, user_id) values (${comments[1]}, ${owner}), (${comments[1]}, ${neighbor})`;
	});
});

test.afterAll(async () => {
	const uploads = await sql`select media from community_reposts where user_id in ${sql([owner, neighbor])}`;
	for (const row of uploads) for (const item of row.media) await fs.rm(path.join('static/uploads/community', path.basename(item.url)), { force: true });
	await sql.begin(async (tx) => {
		await tx`delete from community_posts where id in ${sql(posts)}`;
		await tx`delete from reports where id = ${report}`;
		await tx`delete from users where id in ${sql([owner, neighbor])}`;
	});
	await sql.end();
});

test('feed shows only the popular or sole comment; blank spaces and media open a full-page thread', async ({ page, baseURL }) => {
	await page.context().addCookies([{ name: 'surios_session', value: session, url: baseURL! }]);
	await page.goto(`/community?q=${posts[0]}`); await page.waitForLoadState('networkidle');
	const article = page.locator(`#post-${posts[0]}`);
	await expect(article.locator('[data-comment-id]')).toHaveCount(1);
	await expect(article.getByText('Most popular comment.', { exact: true })).toBeVisible();
	await expect(article.getByText('First comment with a reply.', { exact: true })).toHaveCount(0);
	await article.locator('header').click({ position: { x: 270, y: 6 } });
	await expect(page).toHaveURL(new RegExp(`/community/post/${posts[0]}`));
	await expect(page.getByRole('heading', { name: 'Post', exact: true })).toBeVisible();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await expect(page.locator('[data-comment-id]')).toHaveCount(3);
	await page.reload(); await expect(page.locator('[data-comment-id]')).toHaveCount(3);
	await page.goto(`/community?q=${posts[1]}`); await page.waitForLoadState('networkidle');
	await expect(page.locator('[data-comment-id]')).toHaveCount(1);
	await expect(page.getByText('The only comment.', { exact: true })).toBeVisible();
	await page.getByRole('button', { name: 'Show photo: Road side.jpg', exact: true }).click();
	await expect(page).toHaveURL(/\/community\?q=/);
	await page.getByRole('link', { name: `Open post: ${marker} road update 1`, exact: true }).click();
	await expect(page).toHaveURL(new RegExp(`media=${media[1].id}`));
	await expect(page.locator('.media-frame > img')).toHaveAttribute('src', media[1].url);
	await expect(page.getByRole('dialog')).toHaveCount(0);
	for (const width of [320, 375, 768, 1440]) { await page.setViewportSize({ width, height: 900 }); expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width); }
});

test('comment likes are persisted and idempotent, affect top preview, and never change hazard scores', async ({ request, page }) => {
	const baseline = await reportState();
	for (const token of [session, otherSession]) {
		const response = await request.post(`/api/community/comments/${comments[1]}`, { headers: await signIn(request, token), data: { liked: false } }); expect(response.status()).toBe(200);
	}
	await page.goto(`/community?q=${posts[0]}`);
	await expect(page.locator('[data-comment-id]')).toHaveCount(1);
	await expect(page.getByText('First comment with a reply.', { exact: true })).toBeVisible();
	for (let i = 0; i < 2; i++) expect((await request.post(`/api/community/comments/${comments[1]}`, { headers: await signIn(request), data: { liked: true } })).status()).toBe(200);
	const [likes] = await sql`select count(*)::int as count from community_comment_likes where comment_id = ${comments[1]}`; expect(likes.count).toBe(1);
	await page.reload(); await expect(page.getByText('Most popular comment.', { exact: true })).toBeVisible();
	expect(await reportState()).toEqual(baseline);
});

test('reposts persist one image, appear in feed/search/profile, and add no hazard evidence or severity', async ({ page, baseURL, request }) => {
	await page.context().addCookies([{ name: 'surios_session', value: session, url: baseURL! }]);
	const baseline = await reportState();
	await page.goto(`/community?q=${posts[0]}`); await page.waitForLoadState('networkidle');
	await page.locator(`#post-${posts[0]}`).getByRole('button', { name: 'Repost', exact: true }).click();
	await expect(page.getByRole('dialog', { name: 'Repost', exact: true })).toBeVisible();
	await page.getByLabel('Repost text', { exact: true }).fill(`${marker} shared for neighbors`);
	await page.getByLabel('Repost image', { exact: true }).setInputFiles({ name: 'one-photo.jpg', mimeType: 'image/jpeg', buffer: photo });
	await expect(page.getByAltText('Repost attachment preview')).toBeVisible();
	await expect(page.getByLabel('Repost image', { exact: true })).not.toHaveAttribute('multiple');
	await page.getByRole('button', { name: 'Publish repost', exact: true }).click();
	await expect(page).toHaveURL(/repost=/);
	await expect(page.getByRole('dialog')).toHaveCount(0);
	const id = new URL(page.url()).searchParams.get('repost')!;
	const [saved] = await sql`select * from community_reposts where id = ${id}`;
	expect(saved.post_id).toBe(posts[0]); expect(saved.user_id).toBe(owner); expect(saved.media).toHaveLength(1); expect(saved.media[0].kind).toBe('photo');
	await page.reload(); await expect(page.locator(`#repost-${id}`)).toContainText(`${marker} shared for neighbors`);
	expect((await request.get(saved.media[0].url)).status()).toBe(200);
	await page.goto(`/community?q=${encodeURIComponent(`${marker} shared for neighbors`)}`);
	await expect(page.locator('[data-repost-id]')).toHaveCount(1);
	await expect(page.locator('[data-repost-id]')).toContainText(`${marker} shared for neighbors`);
	await page.goto(`/community?profile=${owner}`);
	await expect(page.locator(`#repost-${id}`)).toBeVisible();
	expect(await reportState()).toEqual(baseline);
	const forbidden = await request.delete(`/api/community/reposts?id=${id}`, { headers: await signIn(request, otherSession) }); expect(forbidden.status()).toBe(404);
	await page.locator(`#repost-${id}`).getByRole('button', { name: 'Undo repost', exact: true }).click();
	await expect(page.locator(`#repost-${id}`)).toHaveCount(0);
	expect((await request.get(saved.media[0].url)).status()).toBe(404);
	expect(await reportState()).toEqual(baseline);
});

test('plain repost retries are idempotent and malformed, multi-image and video uploads are rejected', async ({ request, baseURL }) => {
	const baseline = await reportState();
	const id = randomUUID();
	for (let i = 0; i < 2; i++) { const response = await repost(request, posts[0], '', id); expect(response.status()).toBe(201); expect((await response.json()).id).toBe(id); }
	const [count] = await sql`select count(*)::int as count from community_reposts where id = ${id}`; expect(count.count).toBe(1);
	const anonymous = await fetch(`${baseURL}/api/community/reposts`, { method: 'POST', headers: { Origin: baseURL! } }); expect(anonymous.status).toBe(401);
	expect((await request.post('/api/community/reposts', { headers: { ...await signIn(request), Origin: 'https://example.invalid' }, multipart: { id: randomUUID(), postId: posts[0], body: '' } })).status()).toBe(403);
	const form = new FormData(); form.set('id', randomUUID()); form.set('postId', posts[0]); form.set('body', 'Two images');
	for (let i = 0; i < 2; i++) form.append('image', new Blob([new Uint8Array(photo)], { type: 'image/jpeg' }), `photo-${i}.jpg`);
	const two = await fetch(`${baseURL}/api/community/reposts`, { method: 'POST', headers: { Origin: baseURL!, Cookie: `surios_session=${session}` }, body: form }); expect(two.status).toBe(400);
	for (const [mimeType, buffer, status] of [['video/mp4', Buffer.from('video'), 400], ['image/jpeg', Buffer.from('fake image'), 400], ['image/jpeg', Buffer.alloc(4 * 1024 * 1024 + 1), 413]] as const) {
		const response = await request.post('/api/community/reposts', { headers: await signIn(request), multipart: { id: randomUUID(), postId: posts[0], body: '', image: { name: 'attachment', mimeType, buffer } } }); expect(response.status()).toBe(status);
	}
	expect((await repost(request, randomUUID())).status()).toBe(404);
	expect(await reportState()).toEqual(baseline);
});
