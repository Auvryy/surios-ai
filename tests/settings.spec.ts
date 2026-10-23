import { test, expect, type APIRequestContext } from '@playwright/test';
import postgres from 'postgres';
import { randomUUID, randomBytes, createHash, scryptSync } from 'node:crypto';
import { startLocalMailbox } from './helpers/smtp';

const sql = postgres(process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5433/surios', { max: 1 });
const origin = 'http://127.0.0.1:5177';
const owner = { id: randomUUID(), email: `${randomUUID()}@example.test`, name: 'Settings owner' };
const actor = { id: randomUUID(), email: `${randomUUID()}@example.test`, name: 'Settings contributor' };
const reportId = randomUUID(), postId = randomUUID();
const initialPassword = 'SettingsTest123!', nextPassword = 'ChangedSettings123!';
const salt = randomUUID(), passwordHash = `${salt}:${scryptSync(initialPassword, salt, 64).toString('hex')}`;
let mailbox: Awaited<ReturnType<typeof startLocalMailbox>>;
const preferences = { theme: 'dark', emailComments: false, emailConfirmations: false, legacyMarker: 'preserve' };
async function login(api: APIRequestContext, user = owner, password = initialPassword) {
	return api.post('/login', { headers: { Origin: origin }, form: { email: user.email, password } });
}
async function action(api: APIRequestContext, name: string, form: Record<string, string>) {
	return api.post(`/settings?/${name}`, { headers: { Origin: origin }, form });
}
async function comment(api: APIRequestContext, body: string, parentId?: string) {
	const response = await api.post(`/api/community/posts/${postId}`, { headers: { Origin: origin }, data: { action: 'comment', body, parentId } });
	expect(response.status()).toBe(201); return (await response.json()).comment;
}
const delivered = (email: string, subject: string) => mailbox.messages.filter((mail) => mail.to.includes(email) && mail.subject === subject);
test.beforeAll(async () => {
	mailbox = await startLocalMailbox();
	for (const user of [owner, actor]) await sql`insert into users (id, name, email, password_hash) values (${user.id}, ${user.name}, ${user.email}, ${passwordHash})`;
	const analysis = { isValidInfrastructure: true, distressType: 'pothole', hazardSeverity: 5, riskLevel: 'MODERATE', vruLethality: 'LOW', summary: 'Settings fixture', vruDetails: 'Inspect.', recommendedAction: 'Inspect.', materialsChecklist: [], estimatedDimensions: { depthEstimate: 'Unmeasured', surfaceAreaEstimate: 'Unmeasured' }, urgency: 'PRIORITY', supportBaseline: 0 };
	await sql`insert into reports (id, image_path, latitude, longitude, distress_type, hazard_severity, risk_level, vru_lethality, recommended_action, triage_payload) values (${reportId}, '/samples/pothole-severe.jpg', 12, 123, 'pothole', 5, 'MODERATE', 'LOW', 'Inspect.', ${sql.json(analysis)})`;
	const photoId = randomUUID();
	await sql`insert into community_posts (id, user_id, draft_id, report_id, title, body, location_name, latitude, longitude, media, cover_id, analysis) values (${postId}, ${owner.id}, ${randomUUID()}, ${reportId}, 'Settings email fixture', 'Notification evidence.', 'Fixture location', 12, 123, ${sql.json([{ id: photoId, url: '/samples/pothole-severe.jpg', kind: 'photo', name: 'evidence.jpg', mimeType: 'image/jpeg' }])}, ${photoId}, ${sql.json(analysis)})`;
});
test.beforeEach(async () => {
	await sql`update users set settings = ${sql.json(preferences)}, password_hash = ${passwordHash} where id in ${sql([owner.id, actor.id])}`;
	await sql`delete from password_resets where user_id in ${sql([owner.id, actor.id])}`;
	mailbox.messages.length = 0;
});
test.afterAll(async () => {
	await mailbox?.close();
	await sql`delete from community_posts where id = ${postId}`;
	await sql`delete from reports where id = ${reportId}`;
	await sql`delete from users where id in ${sql([owner.id, actor.id])}`;
	await sql.end();
});

test('minimal categorized settings save only the signed-in user’s email preferences and fit small screens', async ({ page, request }) => {
	await login(page.request); await page.goto('/settings'); await page.waitForLoadState('networkidle');
	await expect(page.getByRole('heading', { name: 'Email notifications', exact: true })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Password & security', exact: true })).toBeVisible();
	await expect(page.getByText(/AI Diagnostics|ASTM Tolerances|Municipal Platform/)).toHaveCount(0);
	await page.getByRole('checkbox', { name: /Comments and replies/ }).check();
	await page.getByRole('checkbox', { name: /Post likes/ }).check();
	await page.getByRole('button', { name: 'Save preferences', exact: true }).click(); await expect(page.getByRole('status')).toHaveText('Email preferences saved.');
	await page.reload(); await expect(page.getByRole('checkbox', { name: /Comments and replies/ })).toBeChecked();
	const [saved] = await sql`select settings from users where id = ${owner.id}`; expect(saved.settings).toEqual({ ...preferences, emailComments: true, emailConfirmations: true });
	const html = await (await page.request.get('/settings')).text(); expect(html).not.toContain(passwordHash); expect(html).not.toContain('passwordHash');
	for (const [width, height] of [[1440, 900], [768, 1024], [375, 812], [320, 740]]) {
		await page.setViewportSize({ width, height }); expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
		await page.screenshot({ path: `.svelte-kit/review/settings-${width}.png` });
	}
	await page.evaluate(() => document.documentElement.classList.add('dark')); await page.screenshot({ path: '.svelte-kit/review/settings-dark.png' });
	expect((await request.post('/settings?/saveNotifications', { headers: { Origin: origin }, form: { emailComments: 'on' } })).status()).toBe(401);
	await login(request);
	expect((await request.post('/settings?/saveNotifications', { headers: { Origin: 'https://example.test' }, form: { emailComments: 'on' } })).status()).toBe(403);
	await action(request, 'saveNotifications', { userId: actor.id, emailComments: 'on', theme: 'light' });
	const [other] = await sql`select settings from users where id = ${actor.id}`; expect(other.settings).toEqual(preferences);
});

test('SMTP emails follow comment/reply and confirmation preferences, suppress self alerts and deduplicate confirmations', async ({ page, browser }) => {
	await login(page.request); await action(page.request, 'saveNotifications', { emailComments: 'on', emailConfirmations: 'on' });
	const other = await browser.newContext({ baseURL: origin });
	try {
		await login(other.request, actor);
		const confirm = () => other.request.post(`/api/community/posts/${postId}`, { headers: { Origin: origin }, data: { action: 'confirm', confirmed: true } });
		expect((await confirm()).status()).toBe(200); await confirm();
		await expect.poll(() => delivered(owner.email, 'Your road update was liked').length, { timeout: 15000 }).toBe(1);
		const [confirmation] = await sql`select count(*)::int as count from email_outbox where event_key = ${`confirmation:${postId}:${actor.id}:${owner.id}`}`; expect(confirmation.count).toBe(1);
		const root = await comment(other.request, 'A notification comment.');
		await expect.poll(() => delivered(owner.email, 'New comment on SuriOS').length, { timeout: 15000 }).toBe(1);
		expect(delivered(owner.email, 'New comment on SuriOS')[0].text).toContain(`${origin}/community?q=${postId}#post-${postId}`);
		const muted = await comment(page.request, 'Reply with notifications disabled.', root.id);
		await expect.poll(async () => (await sql`select status from email_outbox where event_key = ${`comment:${muted.id}:${actor.id}`}`)[0]?.status, { timeout: 15000 }).toBe('skipped');
		expect(mailbox.messages.some((mail) => mail.to.includes(actor.email))).toBe(false);
		await action(other.request, 'saveNotifications', { emailComments: 'on' });
		await comment(page.request, 'Reply with notifications enabled.', root.id);
		await expect.poll(() => delivered(actor.email, 'New reply on SuriOS').length, { timeout: 15000 }).toBe(1);
		await comment(page.request, 'My own comment.');
		const [self] = await sql`select count(*)::int as count from email_outbox where user_id = ${owner.id} and topic = 'comments'`; expect(self.count).toBe(1);
		await page.goto(`/community?q=${postId}`); await page.waitForLoadState('networkidle'); await page.locator('article').getByRole('link', { name: 'Comment', exact: true }).click(); await expect(page.getByText('Reply with notifications enabled.', { exact: true })).toBeVisible();
	} finally { await other.close(); }
});

test('password changes validate current and confirmed passwords and revoke other sessions', async ({ page, browser }) => {
	await login(page.request);
	const other = await browser.newContext({ baseURL: origin });
	try {
		await login(other.request);
		await page.goto('/settings'); await page.waitForLoadState('networkidle'); await page.getByText('Change password', { exact: true }).click();
		await page.getByLabel('Current password', { exact: true }).fill('WrongPassword123!');
		await page.getByLabel('New password', { exact: true }).fill(nextPassword); await page.getByLabel('Confirm new password', { exact: true }).fill(nextPassword);
		await page.getByRole('button', { name: 'Update password', exact: true }).click(); await expect(page.getByRole('alert')).toHaveText('Your current password is incorrect.');
		await page.getByLabel('Current password', { exact: true }).fill(initialPassword); await page.getByLabel('New password', { exact: true }).fill(nextPassword); await page.getByLabel('Confirm new password', { exact: true }).fill('DifferentPassword123!');
		await page.getByRole('button', { name: 'Update password', exact: true }).click(); await expect(page.getByRole('alert')).toHaveText('The passwords do not match.');
		await page.getByLabel('Current password', { exact: true }).fill(initialPassword); await page.getByLabel('New password', { exact: true }).fill(nextPassword); await page.getByLabel('Confirm new password', { exact: true }).fill(nextPassword);
		await page.getByRole('button', { name: 'Update password', exact: true }).click(); await expect(page.getByRole('status')).toContainText('Password changed.');
		const [saved] = await sql`select password_hash from users where id = ${owner.id}`; expect(saved.password_hash).not.toBe(passwordHash);
		expect((await other.request.get('/settings')).url()).toContain('/login?redirectTo=');
		expect((await page.request.get('/settings')).url()).toBe(`${origin}/settings`);
		const [sessions] = await sql`select count(*)::int as count from sessions where user_id = ${owner.id}`; expect(sessions.count).toBe(1);
	} finally { await other.close(); }
});

test('emailed password reset links expire, are single-use, keep tokens out of database plaintext, and revoke sessions', async ({ page, browser }) => {
	await login(page.request);
	await page.goto('/settings'); await page.getByRole('button', { name: 'Email reset link', exact: true }).click(); await expect(page.getByRole('status')).toContainText('If an account uses that email');
	await expect.poll(() => delivered(owner.email, 'Reset your SuriOS password').length, { timeout: 10000 }).toBe(1);
	const mail = delivered(owner.email, 'Reset your SuriOS password')[0];
	const link = /http:\/\/127\.0\.0\.1:5177\/reset-password#token=([a-f0-9]{64})/.exec(mail.text)!; expect(link).not.toBeNull();
	const token = link[1];
	const [stored] = await sql`select token_hash from password_resets where user_id = ${owner.id}`; expect(stored.token_hash).toBe(createHash('sha256').update(token).digest('hex')); expect(stored.token_hash).not.toBe(token);
	const guest = await browser.newContext({ baseURL: origin });
	try {
		const duplicate = await guest.request.post('/forgot-password', { headers: { Origin: origin }, form: { email: owner.email } });
		const unknown = await guest.request.post('/forgot-password', { headers: { Origin: origin }, form: { email: `${randomUUID()}@example.test` } }); expect(await unknown.json()).toEqual(await duplicate.json());
		const [count] = await sql`select count(*)::int as count from password_resets where user_id = ${owner.id}`; expect(count.count).toBe(1);
		const reset = await guest.newPage(); const response = await reset.goto(link[0]); expect(response!.headers()['referrer-policy']).toBe('no-referrer');
		await reset.getByLabel('New password', { exact: true }).fill(nextPassword); await reset.getByLabel('Confirm new password', { exact: true }).fill(nextPassword);
		expect(reset.url()).toBe(`${origin}/reset-password`);
		await reset.getByRole('button', { name: 'Reset password', exact: true }).click(); await expect(reset.getByRole('status')).toContainText('Password reset.');
		expect((await page.request.get('/settings')).url()).toContain('/login?redirectTo=');
		const replay = await guest.request.post('/reset-password', { headers: { Origin: origin }, form: { token, newPassword: 'AnotherPassword123!', confirmPassword: 'AnotherPassword123!' } }); expect(replay.status()).toBe(400);
		await login(guest.request, owner, nextPassword); expect((await guest.request.get('/settings')).url()).toBe(`${origin}/settings`);
		const expired = randomBytes(32).toString('hex'); await sql`insert into password_resets (token_hash, user_id, expires_at) values (${createHash('sha256').update(expired).digest('hex')}, ${owner.id}, ${new Date(Date.now() - 1000)})`;
		const expiry = await guest.request.post('/reset-password', { headers: { Origin: origin }, form: { token: expired, newPassword: initialPassword, confirmPassword: initialPassword } }); expect(expiry.status()).toBe(400);
	} finally { await guest.close(); }
});

test('SMTP failures retain retryable notifications and never claim a reset email was sent', async ({ request, browser }) => {
	await login(request); await action(request, 'saveNotifications', { emailComments: 'on' });
	const other = await browser.newContext({ baseURL: origin });
	try {
		await login(other.request, actor); mailbox.rejectOne(); const saved = await comment(other.request, 'Retry this notification.');
		const key = `comment:${saved.id}:${owner.id}`;
		await expect.poll(async () => (await sql`select attempts from email_outbox where event_key = ${key}`)[0]?.attempts, { timeout: 15000 }).toBe(1);
		await expect.poll(async () => (await sql`select next_attempt_at < now() + interval '90 seconds' as retried from email_outbox where event_key = ${key}`)[0]?.retried, { timeout: 15000 }).toBe(true);
		await sql`update email_outbox set next_attempt_at = now() - interval '1 second' where event_key = ${key}`;
		await expect.poll(async () => (await sql`select status from email_outbox where event_key = ${key}`)[0]?.status, { timeout: 15000 }).toBe('sent');
		expect(delivered(owner.email, 'New comment on SuriOS')).toHaveLength(1);
		mailbox.rejectOne(); const reset = await action(request, 'sendResetLink', {}); expect(reset.status()).toBe(503);
		mailbox.rejectOne(); const publicFailure = await other.request.post('/forgot-password', { headers: { Origin: origin }, form: { email: owner.email } });
		const unknown = await other.request.post('/forgot-password', { headers: { Origin: origin }, form: { email: `${randomUUID()}@example.test` } });
		expect(publicFailure.status()).toBe(200); expect(await publicFailure.json()).toEqual(await unknown.json());
		const [tokens] = await sql`select count(*)::int as count from password_resets where user_id = ${owner.id}`; expect(tokens.count).toBe(0);
	} finally { await other.close(); }
});
