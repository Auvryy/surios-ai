import { test, expect } from '@playwright/test';
import postgres from 'postgres';
import { randomBytes, randomUUID } from 'node:crypto';

const sql = postgres(process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5433/surios', { max: 1 });
const userId = randomUUID(), reportId = randomUUID(), postId = randomUUID();
const token = randomBytes(32).toString('hex');
const title = 'Sharing a saved road update';
const analysis = { isValidInfrastructure: true, rejectionReason: null, distressType: 'pothole', hazardSeverity: 4, riskLevel: 'MODERATE', vruLethality: 'LOW', vruDetails: 'Fixture', estimatedDimensions: { depthEstimate: 'Fixture', surfaceAreaEstimate: 'Fixture' }, recommendedAction: 'Inspect', materialsChecklist: [], urgency: 'ROUTINE', summary: 'Fixture' };

test.beforeAll(async () => {
	const media = [{ id: randomUUID(), url: '/samples/pothole-severe.jpg', kind: 'photo', name: 'Road photo', mimeType: 'image/jpeg' }];
	await sql.begin(async tx => {
		await tx`insert into users (id, email, name, password_hash) values (${userId}, ${`sharefixture-${userId}@example.test`}, 'Share fixture', 'unused')`;
		await tx`insert into sessions (id, user_id, expires_at) values (${token}, ${userId}, ${new Date(Date.now() + 86400000)})`;
		await tx`insert into reports (id, image_path, latitude, longitude, distress_type, hazard_severity, risk_level, vru_lethality, recommended_action) values (${reportId}, '/samples/pothole-severe.jpg', 14.28, 121.42, 'pothole', 4, 'MODERATE', 'LOW', 'Inspect')`;
		await tx`insert into community_posts (id, user_id, draft_id, report_id, title, body, location_name, latitude, longitude, media, cover_id, analysis) values (${postId}, ${userId}, ${randomUUID()}, ${reportId}, ${title}, 'Saved report for sharing checks.', 'Fixture Street', 14.28, 121.42, ${sql.json(media)}, ${media[0].id}, ${sql.json(analysis)})`;
		await tx`insert into community_confirmations (post_id, user_id) values (${postId}, ${userId})`;
	});
});

test.afterAll(async () => {
	await sql.begin(async tx => {
		await tx`delete from community_posts where id = ${postId}`;
		await tx`delete from reports where id = ${reportId}`;
		await tx`delete from users where id = ${userId}`;
	});
	await sql.end();
});

test('confirmed updates hide the duplicate posting box while feed and other filters keep their behavior', async ({ page, baseURL }) => {
	await page.context().addCookies([{ name: 'surios_session', value: token, url: baseURL! }]);
	await page.goto('/liked'); await page.waitForLoadState('networkidle');
	await expect(page).toHaveURL(/tab=liked/);
	await expect(page.locator(`#post-${postId}`)).toBeVisible();
	await expect(page.getByRole('button', { name: 'What’s happening with local infrastructure?', exact: true })).toHaveCount(0);
	for (const name of ['Photos', 'Video', 'Location']) await expect(page.getByRole('button', { name, exact: true })).toHaveCount(0);
	await page.reload(); await expect(page.getByRole('button', { name: 'What’s happening with local infrastructure?', exact: true })).toHaveCount(0);
	await page.waitForLoadState('networkidle');
	await expect(page.getByRole('button', { name: 'All updates', exact: true })).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Critical', exact: true })).toHaveCount(0);
	await page.goto('/community');
	await page.waitForLoadState('networkidle');
	await expect(page.getByRole('button', { name: 'What’s happening with local infrastructure?', exact: true })).toBeVisible();
	await page.getByRole('button', { name: 'Critical', exact: true }).click();
	await expect(page.getByRole('button', { name: 'What’s happening with local infrastructure?', exact: true })).toBeVisible();
	await page.goto(`/community?q=${postId}`);
	await expect(page.getByRole('button', { name: 'What’s happening with local infrastructure?', exact: true })).toHaveCount(0);
});

test('Share opens a compact dialog with copy, Facebook, Messenger fallback and keyboard focus restoration', async ({ page, baseURL }) => {
	await page.addInitScript(() => {
		const state = window as typeof window & { copiedLinks: string[] }; state.copiedLinks = [];
		Object.defineProperty(navigator, 'share', { configurable: true, writable: true, value: undefined });
		Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text: string) => { state.copiedLinks.push(text); } } });
	});
	const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
	await page.goto(`/community?q=${postId}&sort=newest`); await page.waitForLoadState('networkidle');
	const before = page.url(), expected = `${baseURL}/community/post/${postId}`;
	const trigger = page.locator(`#post-${postId}`).getByRole('button', { name: 'Share', exact: true });
	await trigger.click();
	const dialog = page.getByRole('dialog', { name: 'Share post', exact: true });
	await expect(dialog).toBeVisible(); expect(page.url()).toBe(before);
	await expect(dialog.getByRole('textbox', { name: 'Post link' })).toHaveValue(expected);
	expect(await page.evaluate(() => (window as typeof window & { copiedLinks: string[] }).copiedLinks)).toEqual([]);
	await dialog.getByRole('button', { name: 'Copy link', exact: true }).click();
	await expect(dialog.getByRole('status')).toHaveText('Link copied.');
	expect(await page.evaluate(() => (window as typeof window & { copiedLinks: string[] }).copiedLinks)).toEqual([expected]);
	const facebook = dialog.getByRole('link', { name: 'Facebook', exact: true });
	const href = new URL((await facebook.getAttribute('href'))!);
	expect(href.origin + href.pathname).toBe('https://www.facebook.com/sharer/sharer.php'); expect(href.searchParams.get('u')).toBe(expected);
	await expect(facebook).toHaveAttribute('target', '_blank'); await expect(facebook).toHaveAttribute('rel', /noopener/);
	await dialog.getByRole('button', { name: /Messenger/ }).click();
	await expect(dialog.getByRole('link', { name: 'Open Messenger' })).toHaveAttribute('href', 'https://www.facebook.com/messages/');
	expect(await page.evaluate(() => (window as typeof window & { copiedLinks: string[] }).copiedLinks)).toEqual([expected, expected]);
	for (const [width, height] of [[320, 740], [375, 812], [812, 375], [1440, 1000]]) {
		await page.setViewportSize({ width, height });
		await expect.poll(async () => { const box = await dialog.boundingBox(); return !!box && box.x >= 0 && box.y >= 0 && box.x + box.width <= width && box.y + box.height <= height; }).toBe(true);
		expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
	}
	await page.screenshot({ path: '.svelte-kit/review/post-share-desktop.png' });
	await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0); await expect(trigger).toBeFocused();
	await page.goto(`/community/post/${postId}`); await page.waitForLoadState('networkidle');
	await page.getByRole('button', { name: 'Share', exact: true }).click();
	await expect(dialog.getByRole('textbox', { name: 'Post link' })).toHaveValue(expected);
	await expect(dialog.getByRole('link', { name: 'Open Messenger' })).toHaveCount(0);
	expect(errors).toEqual([]);
});

test('clipboard denial leaves a selectable link and native sharing handles cancellation without claiming success', async ({ page, baseURL }) => {
	await page.addInitScript(() => {
		const state = window as typeof window & { sharedPosts: ShareData[] }; state.sharedPosts = [];
		Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new DOMException('denied', 'NotAllowedError'); } } });
		Object.defineProperty(navigator, 'share', { configurable: true, writable: true, value: async (data: ShareData) => { state.sharedPosts.push(data); } });
	});
	await page.goto(`/community/post/${postId}`); await page.waitForLoadState('networkidle');
	await page.getByRole('button', { name: 'Share', exact: true }).click();
	const dialog = page.getByRole('dialog', { name: 'Share post', exact: true });
	await dialog.getByRole('button', { name: 'Copy link', exact: true }).click();
	await expect(dialog.getByRole('status')).toHaveText('Select and copy the link below.');
	const input = dialog.getByRole('textbox', { name: 'Post link' }); await expect(input).toBeFocused();
	expect(await input.evaluate(element => (element as HTMLInputElement).selectionEnd! - (element as HTMLInputElement).selectionStart!)).toBe(`${baseURL}/community/post/${postId}`.length);
	await dialog.getByRole('button', { name: /Messenger/ }).click();
	expect(await page.evaluate(() => (window as typeof window & { sharedPosts: ShareData[] }).sharedPosts)).toEqual([{ title, url: `${baseURL}/community/post/${postId}` }]);
	await page.evaluate(() => { navigator.share = async () => { throw new DOMException('cancelled', 'AbortError'); }; });
	await dialog.getByRole('button', { name: 'More apps', exact: true }).click(); await expect(dialog.getByRole('status')).toHaveCount(0);
	await page.evaluate(() => { navigator.share = async () => { throw new DOMException('denied', 'NotAllowedError'); }; });
	await dialog.getByRole('button', { name: 'More apps', exact: true }).click();
	await expect(dialog.getByRole('status')).toHaveText('Your device could not open sharing. You can copy the link instead.');
	await dialog.getByRole('button', { name: /Messenger/ }).click();
	await expect(dialog.getByRole('link', { name: 'Open Messenger' })).toBeVisible();
	await expect(dialog.getByRole('status')).toHaveText('Select and copy the link below.');
	await page.setViewportSize({ width: 375, height: 812 }); await page.evaluate(() => document.documentElement.classList.add('dark'));
	await page.screenshot({ path: '.svelte-kit/review/post-share-mobile-dark.png' });
});
