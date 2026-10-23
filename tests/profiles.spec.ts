import { test, expect, type APIRequestContext } from '@playwright/test';
import postgres from 'postgres';
import { randomUUID, scryptSync } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const sql = postgres(process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5433/surios', { max: 1 });
const origin = 'http://127.0.0.1:5177';
const prefix = `Profile QA ${randomUUID().slice(0, 8)}`;
const alice = { id: randomUUID(), name: `${prefix} Alice`, email: `${randomUUID()}@example.test` };
const bob = { id: randomUUID(), name: `${prefix} Bob`, email: `${randomUUID()}@example.test` };
const reportIds = [randomUUID(), randomUUID()];
const postIds: string[] = [];
const commentId = randomUUID();
const photos = new Set<string>();
const password = 'ProfileTest123!';
const salt = randomUUID();
const hash = `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
const analysis = { isValidInfrastructure: true, distressType: 'pothole', hazardSeverity: 5, riskLevel: 'MODERATE', vruLethality: 'LOW', vruDetails: 'Fixture', summary: 'Profile test evidence.', recommendedAction: 'Inspect.', materialsChecklist: [], estimatedDimensions: { depthEstimate: 'Unmeasured', surfaceAreaEstimate: 'Unmeasured' }, urgency: 'PRIORITY' };
async function login(api: APIRequestContext) {
	await api.post('/login', { headers: { Origin: origin }, form: { email: alice.email, password } });
}
async function trackPhotos() {
	const [user] = await sql`select avatar_url, cover_url from users where id = ${alice.id}`;
	for (const url of [user?.avatar_url, user?.cover_url]) if (url) photos.add(url);
	return user;
}
test.beforeAll(async () => {
	for (const user of [alice, bob]) await sql`insert into users (id, email, name, password_hash) values (${user.id}, ${user.email}, ${user.name}, ${hash})`;
	for (const id of reportIds) await sql`insert into reports (id, image_path, latitude, longitude, distress_type, hazard_severity, risk_level, vru_lethality, recommended_action, triage_payload) values (${id}, '/samples/pothole-severe.jpg', 12, 123, 'pothole', 5, 'MODERATE', 'LOW', 'Inspect.', ${sql.json(analysis)})`;
	for (let index = 0; index < 22; index++) {
		const id = randomUUID(); postIds.push(id);
		const author = index === 21 ? bob : alice;
		const photoId = randomUUID();
		const media = [{ id: photoId, url: '/samples/pothole-severe.jpg', kind: 'photo', name: 'Evidence.jpg', mimeType: 'image/jpeg' }];
		await sql`insert into community_posts (id, user_id, draft_id, report_id, title, body, location_name, latitude, longitude, media, cover_id, analysis, created_at) values (${id}, ${author.id}, ${randomUUID()}, ${index === 21 ? reportIds[1] : reportIds[0]}, ${`${prefix} post ${index}`}, 'Saved profile post.', 'Fixture location', 12, 123, ${sql.json(media)}, ${photoId}, ${sql.json(analysis)}, ${new Date(Date.now() - index * 1000)})`;
	}
	await sql`insert into community_comments (id, user_id, post_id, body) values (${commentId}, ${bob.id}, ${postIds[21]}, 'A question about this report.')`;
});
test.afterAll(async () => {
	await trackPhotos();
	if (postIds.length) await sql`delete from community_posts where id in ${sql(postIds)}`;
	await sql`delete from reports where id in ${sql(reportIds)}`;
	await sql`delete from users where id in ${sql([alice.id, bob.id])}`;
	await Promise.all([...photos].map((url) => fs.rm(path.join('static/uploads/community', path.basename(url)), { force: true })));
	await sql.end();
});

test('owner edits name, avatar and cover; public profiles are private-data safe, persistent and paginated', async ({ page, browser }) => {
	await login(page.request); await page.goto('/profile'); await page.waitForLoadState('networkidle');
	await expect(page.getByRole('heading', { name: alice.name, exact: true })).toBeVisible();
	const avatarControl = page.getByRole('button', { name: 'Change profile picture', exact: true });
	const coverControl = page.getByRole('button', { name: 'Change cover photo', exact: true });
	await expect(avatarControl).toHaveCSS('opacity', '0');
	await avatarControl.hover(); await expect(avatarControl).toHaveCSS('opacity', '1');
	const avatarPicker = page.waitForEvent('filechooser'); await avatarControl.click();
	await (await avatarPicker).setFiles('static/samples/pothole-severe.jpg');
	await expect(page.getByRole('status')).toContainText('Profile picture updated.'); await trackPhotos();
	await coverControl.focus(); await expect(coverControl).toHaveCSS('opacity', '1');
	const coverPicker = page.waitForEvent('filechooser'); await coverControl.click();
	await (await coverPicker).setFiles('static/samples/alligator-fatigue.jpg');
	await expect(page.getByRole('status')).toContainText('Cover photo updated.'); await trackPhotos();
	await expect(page.locator('article')).toHaveCount(20);
	await page.getByRole('button', { name: 'Load more posts', exact: true }).click(); await expect(page.locator('article')).toHaveCount(21);
	await expect(page.locator(`#post-${postIds[21]}`)).toHaveCount(0);
	await page.getByRole('button', { name: 'Edit profile', exact: true }).click();
	await page.getByLabel('Name', { exact: true }).fill(`${alice.name} Updated`);
	await page.getByLabel('Profile picture', { exact: true }).setInputFiles('static/samples/pothole-severe.jpg');
	await page.getByLabel('Cover photo', { exact: true }).setInputFiles('static/samples/alligator-fatigue.jpg');
	await page.getByRole('button', { name: 'Save changes', exact: true }).click(); await expect(page.getByRole('dialog')).toBeHidden();
	const saved = await trackPhotos(); expect(saved.avatar_url).toMatch(/^\/media\/.+\.jpg$/); expect(saved.cover_url).toMatch(/^\/media\/.+\.jpg$/);
	await page.reload(); await expect(page.getByRole('heading', { name: `${alice.name} Updated`, exact: true })).toBeVisible();
	await expect(page.getByRole('region', { name: 'Profile', exact: true }).locator('img').first()).toHaveAttribute('src', saved.cover_url);
	for (const url of [saved.avatar_url, saved.cover_url]) expect((await page.request.get(url)).status()).toBe(200);
	const mobile = await browser.newContext({ baseURL: origin, viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
	try {
		await login(mobile.request); const ownPage = await mobile.newPage(); await ownPage.goto('/profile');
		await expect(ownPage.getByRole('button', { name: 'Change profile picture', exact: true })).toHaveCSS('opacity', '1');
		await expect(ownPage.getByRole('button', { name: 'Change cover photo', exact: true })).toHaveCSS('opacity', '1');
		await ownPage.screenshot({ path: '.svelte-kit/review/profile-owner-touch.png' });
	} finally { await mobile.close(); }
	const guest = await browser.newContext({ baseURL: origin });
	try {
		const other = await guest.newPage(); const response = await other.goto(`/profile/${alice.id}`); const html = await response!.text();
		await expect(other.getByRole('heading', { name: `${alice.name} Updated`, exact: true })).toBeVisible();
		await expect(other.getByRole('button', { name: 'Edit profile', exact: true })).toHaveCount(0);
		expect(html).not.toContain(alice.email); expect(html).not.toContain(hash); expect(html).not.toContain('passwordHash');
		for (const [width, height] of [[1440, 900], [768, 1024], [375, 812], [320, 740], [812, 375]]) {
			await other.setViewportSize({ width, height }); expect(await other.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
			await other.screenshot({ path: `.svelte-kit/review/profile-${width}.png` });
		}
		await other.evaluate(() => document.documentElement.classList.add('dark')); await other.screenshot({ path: '.svelte-kit/review/profile-dark.png' });
		await other.locator('article').first().getByRole('button', { name: 'Comment', exact: true }).click();
		await other.locator('article').first().getByRole('textbox', { name: /Comment on/ }).fill('Guest reply');
		await other.locator('article').first().getByRole('button', { name: 'Send comment' }).click(); await expect(other).toHaveURL(/\/login\?redirectTo=/);
	} finally { await guest.close(); }
});

test('community author links open another profile; comments and replies persist across profile and feed', async ({ page }) => {
	await sql`update users set name = ${`${alice.name} Updated`} where id = ${alice.id}`;
	await login(page.request); await page.goto(`/community?q=${postIds[21]}`); await page.waitForLoadState('networkidle');
	await page.locator('article').getByRole('link', { name: `View profile of ${bob.name}`, exact: true }).click();
	await expect(page).toHaveURL(`${origin}/community?profile=${bob.id}`);
	await expect(page.getByRole('link', { name: 'Community feed', exact: true })).toHaveAttribute('aria-current', 'page');
	await expect(page.getByRole('link', { name: 'Profile', exact: true })).not.toHaveAttribute('aria-current', 'page');
	await expect(page.getByRole('heading', { name: bob.name, exact: true })).toBeVisible();
	await expect(page.locator('article')).toHaveCount(1); await expect(page.getByRole('button', { name: 'Edit profile' })).toHaveCount(0);
	const article = page.locator('article'); await article.getByRole('button', { name: 'Comment', exact: true }).click();
	await article.getByRole('button', { name: 'Reply', exact: true }).click();
	await article.getByRole('textbox', { name: /Comment on/ }).fill('A saved reply from another person.');
	await article.getByRole('button', { name: 'Send reply', exact: true }).click();
	await expect(article.getByText('A saved reply from another person.', { exact: true })).toBeVisible();
	const [reply] = await sql`select parent_id, user_id from community_comments where post_id = ${postIds[21]} and body = 'A saved reply from another person.'`;
	expect(reply.parent_id).toBe(commentId); expect(reply.user_id).toBe(alice.id);
	await page.goto(`/community?q=${postIds[21]}`); await page.waitForLoadState('networkidle');
	await page.locator('article').getByRole('button', { name: 'Comment', exact: true }).click();
	await expect(page.getByText('A saved reply from another person.', { exact: true })).toBeVisible();
	await page.locator('article').getByRole('link', { name: `View profile of ${alice.name} Updated`, exact: true }).click();
	await expect(page).toHaveURL(`${origin}/community?profile=${alice.id}`);
	await expect(page.getByRole('button', { name: 'Edit profile', exact: true })).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Change profile picture', exact: true })).toHaveCount(0);
	await page.getByRole('link', { name: 'Profile', exact: true }).click();
	await expect(page).toHaveURL(`${origin}/profile`);
	await expect(page.getByRole('button', { name: 'Edit profile', exact: true })).toBeVisible();
});

test('profile updates validate ownership, origin and image bytes; reply targets must belong to the post', async ({ request }) => {
	expect((await request.post('/api/profile', { multipart: { name: 'Unauthorized' } })).status()).toBe(401);
	expect((await request.get('/profile/not-an-id')).status()).toBe(404);
	expect((await request.get(`/profile/${randomUUID()}`)).status()).toBe(404);
	await login(request);
	expect((await request.post('/api/profile', { headers: { Origin: 'https://example.test' }, multipart: { name: 'Unsafe' } })).status()).toBe(403);
	expect((await request.post('/api/profile', { headers: { Origin: origin }, multipart: { name: 'X' } })).status()).toBe(400);
	expect((await request.post('/api/profile', { headers: { Origin: origin }, multipart: { name: alice.name, avatar: { name: 'fake.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('not a jpeg') } } })).status()).toBe(400);
	expect((await request.post('/api/profile', { headers: { Origin: origin }, multipart: { name: alice.name, cover: { name: 'huge.jpg', mimeType: 'image/jpeg', buffer: Buffer.alloc(4 * 1024 * 1024 + 1) } } })).status()).toBe(413);
	expect((await request.post(`/api/community/posts/${postIds[0]}`, { headers: { Origin: origin }, data: { action: 'comment', body: 'Wrong post', parentId: commentId } })).status()).toBe(400);
	const update = await request.post('/api/profile', { headers: { Origin: origin }, multipart: { name: `${alice.name} Updated`, userId: bob.id, removeAvatar: 'true', removeCover: 'true' } }); expect(update.status()).toBe(200);
	const [other] = await sql`select name from users where id = ${bob.id}`; expect(other.name).toBe(bob.name);
	const [self] = await sql`select avatar_url, cover_url from users where id = ${alice.id}`; expect(self.avatar_url).toBeNull(); expect(self.cover_url).toBeNull();
});
