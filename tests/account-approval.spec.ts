import { test as base, expect } from '@playwright/test';
import postgres from 'postgres';
import { randomUUID, scryptSync } from 'node:crypto';
const test = base.extend({ request: async ({ playwright, baseURL }, use) => { const api = await playwright.request.newContext({ baseURL, extraHTTPHeaders: { Accept: 'text/html' } }); await use(api); await api.dispose(); } });
const sql = postgres(process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5433/surios', { max: 1 });
const mark = `approval${randomUUID().replaceAll('-', '')}`;
const password = 'ApprovalTest123!';
let adminId: string;
let adminToken: string;
const origin = process.env.APPROVAL_TEST_ORIGIN || 'http://127.0.0.1:5177';
const email = (name: string) => `${mark}${name}@example.test`;
const details = (name: string, role = 'OFFICER') => ({ name: `Test ${name}`, email: email(name), password, confirmPassword: password, role, department: 'Municipal Engineering Office', level: 'BARANGAY', jurisdiction: 'Barangay Poblacion, Santa Cruz, Laguna', badgeNumber: 'GOV-TEST-204' });
const adminHeaders = () => ({ Origin: origin, Cookie: `surios_session=${adminToken}` });
test.beforeAll(async () => {
	const salt = 'approvaltestsalt';
	const hash = `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
	[ { id: adminId } ] = await sql`insert into users (email,name,password_hash,role) values (${email('admin')}, 'Test Administrator', ${hash}, 'ADMIN') returning id`;
	adminToken = randomUUID();
	await sql`insert into sessions (id,user_id,expires_at) values (${adminToken},${adminId},now()+interval '1 day')`;
});
test.afterAll(async () => { await sql`delete from users where email like ${mark + '%'}`; await sql.end(); });

test('citizen signup is active and cannot request admin access', async ({ request }) => {
	let response = await request.post('/register', { form: details('citizen', 'CITIZEN'), maxRedirects: 0 });
	expect(response.status()).toBe(303);
	expect(response.headers().location).toBe('/community');
	const [user] = await sql`select role,account_status,government_profile,badge_number from users where email=${email('citizen')}`;
	expect(user).toMatchObject({ role: 'CITIZEN', account_status: 'ACTIVE', government_profile: null, badge_number: null });
	await request.post('/logout');
	response = await request.post('/register', { form: details('fakeadmin', 'ADMIN'), maxRedirects: 0 });
	expect(response.status()).toBe(400);
	expect(await sql`select id from users where email=${email('fakeadmin')}`).toHaveLength(0);
});

test('government signup requires office, ID and jurisdiction, then blocks government APIs pending approval', async ({ request }) => {
	for (const missing of ['department', 'jurisdiction', 'badgeNumber']) {
		const response = await request.post('/register', { form: { ...details('pending'), [missing]: '' }, maxRedirects: 0 });
		expect(response.status()).toBe(400);
	}
	const response = await request.post('/register', { form: { ...details('pending'), accountStatus: 'ACTIVE' }, maxRedirects: 0 });
	expect(response.status()).toBe(303);
	expect(response.headers().location).toBe('/account-status');
	const [user] = await sql`select role,account_status,government_profile,badge_number from users where email=${email('pending')}`;
	expect(user).toMatchObject({ role: 'OFFICER', account_status: 'PENDING', badge_number: 'GOV-TEST-204', government_profile: { level: 'BARANGAY', jurisdiction: details('pending').jurisdiction } });
	for (const url of ['/dashboard', '/profile', '/admin']) expect((await request.get(url, { maxRedirects: 0 })).headers().location).toBe('/account-status');
	for (const url of ['/api/community/reposts', '/api/profile', '/api/community/government-media']) expect((await request.post(url, { headers: { Origin: origin }, multipart: { name: 'Forged update', accountStatus: 'ACTIVE' } })).status()).toBe(403);
});

test('admin can approve and suspend/reactivate government access; old sessions stay revoked', async ({ browser }) => {
	const government = await browser.newContext();
	const registration = await government.request.post('/register', { headers: { Accept: 'text/html' }, form: details('lifecycle'), maxRedirects: 0 });
	expect(registration.status()).toBe(303);
	const [user] = await sql`select id from users where email=${email('lifecycle')}`;
	const admin = await browser.newContext();
	const page = await admin.newPage();
	await page.goto('/login');
	await page.getByLabel('Email address').fill(email('admin'));
	await page.getByLabel('Password', { exact: false }).fill(password);
	await page.getByRole('button', { name: 'Continue', exact: true }).click();
	await expect(page).toHaveURL(/\/admin$/);
	await page.waitForLoadState('networkidle');
	const card = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Test lifecycle' }) });
	await expect(card).toContainText('GOV-TEST-204');
	await expect(card).toContainText(details('lifecycle').jurisdiction);
	await card.getByRole('button', { name: 'Approve government account' }).click();
	await expect(page.getByRole('status')).toContainText('active');
	const [approved] = await sql`select account_status,reviewed_by,reviewed_at from users where id=${user.id}`;
	expect(approved.account_status).toBe('ACTIVE');
	expect(approved.reviewed_by).toBe(adminId);
	expect(approved.reviewed_at).toBeTruthy();
	expect((await government.request.get('/dashboard')).status()).toBe(200);
	expect((await government.request.get('/admin')).status()).toBe(403);
	await expect(card).toHaveCount(0);
	const [oldSession] = await sql`select id from sessions where user_id=${user.id}`;
	await page.getByLabel('Status', { exact: true }).selectOption('ACTIVE');
	await card.getByRole('button', { name: 'Deactivate account' }).click();
	await expect(page.getByRole('status')).toContainText('inactive');
	await expect(card).toHaveCount(0);
	expect(await sql`select id from sessions where user_id=${user.id}`).toHaveLength(0);
	expect((await government.request.get('/dashboard', { maxRedirects: 0 })).headers().location).toContain('/login');
	expect((await government.request.post('/login', { headers: { Accept: 'text/html' }, form: { email: email('lifecycle'), password } })).status()).toBe(403);
	await page.getByLabel('Status', { exact: true }).selectOption('INACTIVE');
	await card.getByRole('button', { name: 'Activate account' }).click();
	await expect(page.getByRole('status')).toContainText('active');
	expect((await government.request.get('/dashboard', { headers: { Cookie: `surios_session=${oldSession.id}` }, maxRedirects: 0 })).headers().location).toContain('/login');
	expect((await government.request.post('/login', { headers: { Accept: 'text/html' }, form: { email: email('lifecycle'), password }, maxRedirects: 0 })).status()).toBe(303);
	expect((await government.request.get('/dashboard')).status()).toBe(200);
	await government.close(); await admin.close();
});

test('rejected applications cannot bypass approval, citizens cannot use admin actions, other admins are protected', async ({ request, playwright }) => {
	const adminApi = await playwright.request.newContext({ baseURL: origin, extraHTTPHeaders: { ...adminHeaders(), Accept: 'text/html' } });
	await request.post('/register', { form: details('reject'), maxRedirects: 0 });
	const [pending] = await sql`select id from users where email=${email('reject')}`;
	let response = await adminApi.post('/admin?/update', { form: { id: pending.id, decision: 'activate' } });
	expect(response.status()).toBe(409);
	response = await adminApi.post('/admin?/update', { form: { id: pending.id, decision: 'reject' } });
	expect(response.status()).toBe(200);
	expect((await sql`select account_status from users where id=${pending.id}`)[0].account_status).toBe('REJECTED');
	expect(await sql`select id from sessions where user_id=${pending.id}`).toHaveLength(0);
	await request.post('/login', { form: { email: email('reject'), password } });
	expect((await request.get('/dashboard', { maxRedirects: 0 })).headers().location).toBe('/account-status');
	await request.post('/logout');
	await request.post('/register', { form: details('forbidden', 'CITIZEN') });
	expect((await request.get('/admin')).status()).toBe(403);
	expect((await request.post('/admin?/update', { form: { id: pending.id, decision: 'approve' } })).status()).toBe(403);
	expect((await adminApi.post('/admin?/update', { form: { id: adminId, decision: 'deactivate' } })).status()).toBe(403);
	await adminApi.dispose();
});

test('registration and approval screens fit mobile, preserve failed forms, and keep IDs out of public profiles', async ({ page, request }) => {
	await page.setViewportSize({ width: 375, height: 812 });
	await page.goto('/register');
	await page.waitForLoadState('networkidle');
	await page.getByRole('radio', { name: 'Government', exact: true }).check();
	await expect(page.getByLabel('Work location / jurisdiction')).toBeVisible();
	await page.getByLabel('Full name').fill('Mobile applicant');
	await page.getByLabel('Email address').fill(email('admin'));
	await page.getByLabel('Office / department').fill('Municipal office');
	await page.getByLabel('Work location / jurisdiction').fill('Santa Cruz, Laguna');
	await page.getByLabel('Government ID number').fill('PRIVATE-ID-504');
	await page.getByLabel('Password', { exact: true }).fill(password);
	await page.getByLabel('Confirm password', { exact: true }).fill(password);
	await page.getByRole('button', { name: 'Submit government application' }).click();
	await expect(page.getByRole('alert')).toContainText('already exists');
	await expect(page.getByRole('radio', { name: 'Government', exact: true })).toBeChecked();
	await expect(page.getByLabel('Government ID number')).toHaveValue('PRIVATE-ID-504');
	await page.getByLabel('Email address').fill(email('mobile'));
	await page.getByLabel('Password', { exact: true }).fill(password);
	await page.getByLabel('Confirm password', { exact: true }).fill(password);
	await page.getByRole('button', { name: 'Submit government application' }).click();
	await expect(page.getByText('Pending approval', { exact: true })).toBeVisible();
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
	const [user] = await sql`select id from users where email=${email('mobile')}`;
	await request.post('/admin?/update', { headers: adminHeaders(), form: { id: user.id, decision: 'approve' } });
	const profile = await request.get(`/profile/${user.id}`, { headers: { Cookie: '' } });
	expect(await profile.text()).not.toContain('PRIVATE-ID-504');
	await page.context().clearCookies();
	await page.context().addCookies([{ name: 'surios_session', value: adminToken, url: origin }]);
	await page.goto('/admin');
	await page.getByLabel('Status', { exact: true }).selectOption('ALL');
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});


test('admin activation controls also apply to citizen accounts and reject malformed or stale decisions', async ({ playwright }) => {
	const api = await playwright.request.newContext({ baseURL: origin, extraHTTPHeaders: { ...adminHeaders(), Accept: 'text/html' } });
	const salt = 'citizensalt';
	const hash = `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
	const [citizen] = await sql`insert into users (name,email,password_hash) values ('Citizen activation test',${email('toggle')},${hash}) returning id`;
	const token = randomUUID();
	await sql`insert into sessions (id,user_id,expires_at) values (${token},${citizen.id},now()+interval '1 day')`;
	expect((await api.post('/admin?/update', { form: { id: '------------------------------------', decision: 'approve' } })).status()).toBe(400);
	expect((await api.post('/admin?/update', { form: { id: citizen.id, decision: 'approve' } })).status()).toBe(409);
	expect((await api.post('/admin?/update', { form: { id: citizen.id, decision: 'deactivate' } })).status()).toBe(200);
	expect(await sql`select id from sessions where user_id=${citizen.id}`).toHaveLength(0);
	expect((await sql`select account_status from users where id=${citizen.id}`)[0].account_status).toBe('INACTIVE');
	expect((await api.post('/admin?/update', { form: { id: citizen.id, decision: 'activate' } })).status()).toBe(200);
	expect((await sql`select account_status from users where id=${citizen.id}`)[0].account_status).toBe('ACTIVE');
	await api.dispose();
});
