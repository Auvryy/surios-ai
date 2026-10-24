import { test, expect, type APIRequestContext } from '@playwright/test';
import postgres from 'postgres';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { createHash, randomUUID, scryptSync } from 'node:crypto';
import { startLocalMailbox } from './helpers/smtp';

const origin = process.env.MOBILE_API_TEST_ORIGIN || 'http://127.0.0.1:5177';
const previewOrigin = 'http://localhost:8081';
const mock = 'http://127.0.0.1:5198';
const sql = postgres(process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5433/surios', { max: 1 });
const mark = `mobile${randomUUID().replaceAll('-', '')}`;
const password = 'MobileIntegration123!';
const account = (name: string) => `${mark}${name}@example.test`;
const actors = ['CITIZEN', 'NEIGHBOR', 'OFFICER', 'ENGINEER', 'ADMIN', 'RECOVERY'].map((name) => ({ name, id: randomUUID(), token: '', email: account(name.toLowerCase()) }));
const headers = (index = 0) => ({ Authorization: `Bearer ${actors[index].token}` });
const reportIds = [randomUUID(), randomUUID()];
const postIds = [randomUUID(), randomUUID(), randomUUID()];
const files = new Set<string>();
let api: APIRequestContext;
let mailbox: Awaited<ReturnType<typeof startLocalMailbox>>;
let photo: Buffer;
const analysis = { isValidInfrastructure: true, rejectionReason: null, infrastructureType: 'ROAD_PAVEMENT', distressType: 'pothole', hazardSeverity: 3, riskLevel: 'LOW', vruLethality: 'LOW', vruDetails: 'Visible localized surface damage.', estimatedDimensions: { depthEstimate: 'Unmeasured', surfaceAreaEstimate: 'Unmeasured' }, recommendedAction: 'Inspect the affected surface.', materialsChecklist: [], urgency: 'ROUTINE', summary: 'Localized surface damage.', severityEvidence: { visibleDefects: ['A localized pothole is visible.'], reportedConditions: [], criticalDangerVisible: false, confidence: 'MEDIUM', limitations: 'Dimensions require an inspection.' } };
const sessionId = (token: string) => `mobile:${createHash('sha256').update(token).digest('hex')}`;
async function login(index = 0, nextPassword = password) {
	const response = await api.post('/api/auth/login', { data: { email: actors[index].email, password: nextPassword } });
	expect(response.status(), await response.text()).toBe(200);
	return response.json();
}
async function control(mode = 'valid', overrides: Record<string, unknown> = {}) {
	await fetch(mock + '/control', { method: 'POST', body: JSON.stringify({ mode, overrides }) });
}
async function register(name: string, extra: Record<string, unknown> = {}) {
	return api.post('/api/auth/register', { data: { name: `${mark} ${name}`, email: account(name), password, confirmPassword: password, ...extra } });
}

test.beforeAll(async ({ playwright }) => {
	api = await playwright.request.newContext({ baseURL: origin, extraHTTPHeaders: { Accept: 'application/json' } });
	const tlsDirectory = process.env.MOBILE_API_TEST_TLS_DIR;
	mailbox = await startLocalMailbox(tlsDirectory ? { tls: { key: await fs.readFile(path.join(tlsDirectory, 'key.pem')), cert: await fs.readFile(path.join(tlsDirectory, 'cert.pem')) } } : undefined);
	photo = await fs.readFile('static/samples/pothole-severe.jpg');
	const salt = 'mobile-integration-salt';
	const hash = `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
	for (const actor of actors) {
		await sql`insert into users(id,name,email,password_hash,role,badge_number) values(${actor.id},${mark + ' ' + actor.name},${actor.email},${hash},${['NEIGHBOR','RECOVERY'].includes(actor.name) ? 'CITIZEN' : actor.name},'PRIVATE-TEST-ID')`;
		actor.token = (await login(actors.indexOf(actor))).accessToken;
	}
	for (const id of reportIds) await sql`insert into reports(id,image_path,latitude,longitude,distress_type,hazard_severity,risk_level,vru_lethality,recommended_action,triage_payload) values(${id},'/samples/pothole-severe.jpg',14.28,121.42,'pothole',3,'LOW','LOW','Inspect the affected surface.',${sql.json(analysis)})`;
	for (let index = 0; index < postIds.length; index++) {
		const media = [{ id: randomUUID(), url: '/samples/pothole-severe.jpg', kind: 'photo', name: 'pothole.jpg', mimeType: 'image/jpeg' }];
		await sql`insert into community_posts(id,user_id,draft_id,report_id,title,body,location_name,latitude,longitude,media,cover_id,analysis) values(${postIds[index]},${actors[index === 1 ? 1 : 0].id},${randomUUID()},${reportIds[index === 2 ? 1 : 0]},${mark + ' report ' + index},'Visible localized damage.','Mobile test location',14.28,121.42,${sql.json(media)},${media[0].id},${sql.json(analysis)})`;
	}
});
test.beforeEach(async () => { await control(); });
test.afterAll(async () => {
	if (api) await control();
	const people = await sql`select id,avatar_url,cover_url from users where email like ${mark + '%'}`;
	const ids = people.map((row) => row.id);
	if (ids.length) {
		const drafts = await sql`select media from community_drafts where user_id in ${sql(ids)}`;
		const posts = await sql`select media,report_id from community_posts where user_id in ${sql(ids)}`;
		const quotes = await sql`select media,government_update from community_reposts where user_id in ${sql(ids)}`;
		const staged = await sql`select media from government_media where user_id in ${sql(ids)}`;
		for (const row of [...drafts, ...posts, ...quotes]) for (const item of row.media || []) files.add(item.url);
		for (const row of quotes) for (const item of row.government_update?.attachments || []) files.add(item.url);
		for (const row of staged) files.add(row.media.url);
		for (const row of people) for (const url of [row.avatar_url, row.cover_url]) if (url) files.add(url);
		await sql`delete from community_comments where user_id in ${sql(ids)}`;
		await sql`delete from community_posts where user_id in ${sql(ids)}`;
		await sql`delete from report_observations where user_id in ${sql(ids)}`;
		await sql`delete from reports where id in ${sql([...new Set([...reportIds, ...posts.map((row) => row.report_id)])])}`;
		await sql`delete from users where id in ${sql(ids)}`;
	}
	for (const url of files) if (url.startsWith('/media/')) await fs.rm(path.join('static/uploads/community', path.basename(url)), { force: true });
	if (mailbox) await mailbox.close();
	if (api) await api.dispose();
	await sql.end();
});

test('API discovery, public feeds, full threads and maps expose JSON without private account fields', async () => {
	const discovery = await api.get('/api');
	expect(discovery.status()).toBe(200);
	expect((await discovery.json()).mediaLimits.files).toBe(6);
	for (const url of ['/api/community/posts?q=' + mark, `/api/community/posts/${postIds[0]}`, '/api/map/hazards', '/api/map/reports', `/api/map/reports/${reportIds[0]}`, `/api/profiles/${actors[0].id}`]) {
		const response = await api.get(url);
		expect(response.status(), url).toBe(200);
		expect(response.headers()['content-type']).toContain('application/json');
		expect(response.headers()['cache-control']).toContain('no-store');
		const body = await response.text();
		for (const secret of ['passwordHash', 'password_hash', 'PRIVATE-TEST-ID', actors[0].email]) expect(body).not.toContain(secret);
	}
	for (const url of ['/api/community/posts/missing', '/api/community/reposts/missing', '/api/map/reports/missing', '/api/profiles/missing']) expect((await api.get(url)).status()).toBe(404);
});

test('mobile credentials are hashed, never become cookies, renew while active, expire and cannot authorize web pages', async () => {
	const data = await login();
	expect(data).toMatchObject({ tokenType: 'Bearer', user: { id: actors[0].id, role: 'CITIZEN' } });
	expect(data.accessToken).toMatch(/^surios_mobile_[a-f0-9]{64}$/);
	expect(data.user.passwordHash).toBeUndefined();
	expect(await sql`select id from sessions where id=${data.accessToken}`).toHaveLength(0);
	const id = sessionId(data.accessToken);
	expect(await sql`select id from sessions where id=${id}`).toHaveLength(1);
	await sql`update sessions set expires_at=now()+interval '1 hour' where id=${id}`;
	const current = await api.get('/api/auth/session', { headers: { Authorization: `Bearer ${data.accessToken}` } });
	expect(current.status()).toBe(200);
	expect(new Date((await current.json()).expiresAt).getTime()).toBeGreaterThan(Date.now() + 29 * 86400000);
	expect(current.headers()['set-cookie']).toBeUndefined();
	expect((await api.get('/api/auth/session', { headers: { Cookie: `surios_session=${id}` } })).status()).toBe(401);
	expect((await api.get('/api/auth/session', { headers: { Authorization: `Bearer ${id}` } })).status()).toBe(401);
	expect((await api.get('/profile', { headers: headers(), maxRedirects: 0 })).headers().location).toContain('/login');
	await sql`update sessions set expires_at=now()-interval '1 second' where id=${id}`;
	expect((await api.get('/api/auth/session', { headers: { Authorization: `Bearer ${data.accessToken}` } })).status()).toBe(401);
	expect(await sql`select id from sessions where id=${id}`).toHaveLength(0);
});

test('native registration creates shared accounts, checks passwords and rejects forged roles or approval state', async () => {
	for (const extra of [{ role: 'ADMIN' }, { role: 'ENGINEER' }, { accountStatus: 'ACTIVE' }, { confirmPassword: 'WrongPassword123!' }]) expect((await register('invalid', extra)).status()).toBe(400);
	const response = await register('new-citizen');
	expect(response.status()).toBe(201);
	expect(response.headers()['set-cookie']).toBeUndefined();
	const created = await response.json();
	expect(created.user).toMatchObject({ role: 'CITIZEN', accountStatus: 'ACTIVE' });
	expect((await api.get('/api/profile', { headers: { Authorization: `Bearer ${created.accessToken}` } })).status()).toBe(200);
	expect((await register('new-citizen')).status()).toBe(409);
	const web = await api.post('/login', { headers: { Origin: origin, Accept: 'text/html' }, form: { email: account('new-citizen'), password }, maxRedirects: 0 });
	expect(web.status()).toBe(303);
	// Keep the native client free of the browser cookie created by this cross-client check.
	await api.post('/logout', { headers: { Origin: origin }, maxRedirects: 0 });
});

test('native login validates bounded JSON and bad credentials return useful JSON errors', async () => {
	for (const data of [{ email: 'invalid', password }, { email: actors[0].email, password: 'bad' }, { email: account('missing'), password }]) {
		const response = await api.post('/api/auth/login', { data });
		expect([400, 401]).toContain(response.status());
		expect(typeof (await response.json()).message).toBe('string');
	}
	expect((await api.post('/api/auth/login', { headers: { Origin: origin }, form: { email: actors[0].email, password } })).status()).toBe(415);
	expect((await api.post('/api/auth/login', { headers: { 'Content-Type': 'application/json' }, data: '{broken' })).status()).toBe(400);
	expect((await api.post('/api/auth/login', { data: { email: actors[0].email, password: 'x'.repeat(17000) } })).status()).toBe(413);
	const chunked = await new Promise<{ status: number; body: string }>((resolve, reject) => {
		const request = http.request(origin + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' } }, (response) => {
			let body = ''; response.setEncoding('utf8'); response.on('data', (chunk) => { body += chunk; }); response.on('end', () => resolve({ status: response.statusCode!, body }));
		});
		request.on('error', reject); request.write('{"password":"'); request.write('x'.repeat(17000)); request.end('"}');
	});
	expect(chunked.status).toBe(413);
	expect(JSON.parse(chunked.body).message).toContain('too large');
	expect((await api.get('/api/auth/session', { headers: { Authorization: 'Bearer broken' } })).status()).toBe(401);
});

test('browser previews use an exact CORS allowlist and native requests do not need an Origin header', async () => {
	const response = await api.fetch('/api/settings', { method: 'OPTIONS', headers: { Origin: previewOrigin, 'Access-Control-Request-Method': 'PATCH', 'Access-Control-Request-Headers': 'authorization, content-type' } });
	expect(response.status()).toBe(204);
	expect(response.headers()['access-control-allow-origin']).toBe(previewOrigin);
	expect(response.headers()['access-control-allow-credentials']).toBeUndefined();
	const readable = await api.get('/api/settings', { headers: { ...headers(), Origin: previewOrigin } });
	expect(readable.status()).toBe(200);
	expect(readable.headers()['access-control-allow-origin']).toBe(previewOrigin);
	expect((await api.fetch('/api/settings', { method: 'OPTIONS', headers: { Origin: previewOrigin, 'Access-Control-Request-Method': 'PATCH', 'Access-Control-Request-Headers': 'x-untrusted' } })).status()).toBe(403);
	for (const bad of ['https://untrusted.example', 'null']) {
		const denied = await api.get('/api/community/posts', { headers: { Origin: bad } });
		expect(denied.status()).toBe(403);
		expect(denied.headers()['access-control-allow-origin']).toBeUndefined();
	}
});

test('browser cookie sessions keep same-origin checks while bearer mutations work without fabricated headers', async ({ playwright }) => {
	const web = await playwright.request.newContext({ baseURL: origin, extraHTTPHeaders: { Accept: 'application/json' } });
	try {
		expect((await web.post('/login', { headers: { Origin: origin, Accept: 'text/html' }, form: { email: actors[0].email, password }, maxRedirects: 0 })).status()).toBe(303);
		for (const requestOrigin of [undefined, previewOrigin, 'https://untrusted.example']) {
			const response = await web.patch('/api/settings', { headers: requestOrigin ? { Origin: requestOrigin } : {}, data: { emailComments: true } });
			expect(response.status()).toBe(403);
		}
		expect((await web.patch('/api/settings', { headers: { Origin: origin }, data: { emailComments: false } })).status()).toBe(200);
		expect((await web.post('/settings?/saveNotifications', { headers: { Origin: 'https://untrusted.example', Accept: 'text/html' }, form: { emailComments: 'on' } })).status()).toBe(403);
		expect((await web.post('/api/profile', { multipart: { name: 'Cookie upload without origin' } })).status()).toBe(403);
		expect((await web.post('/api/profile', { headers: { Authorization: `Bearer surios_mobile_${'0'.repeat(64)}` }, multipart: { name: 'Cannot fall back to the browser cookie' } })).status()).toBe(401);
		expect((await web.post('/api/auth/logout')).status()).toBe(403);
		expect((await web.post('/api/auth/logout', { headers: { Origin: origin } })).status()).toBe(200);
	} finally { await web.dispose(); }
	expect((await api.patch('/api/settings', { headers: headers(), data: { emailComments: false } })).status()).toBe(200);
});

test('private account and settings APIs enforce ownership and retain preferences', async () => {
	expect((await api.get('/api/account')).status()).toBe(401);
	expect((await api.patch('/api/account', { headers: headers(), data: { id: actors[1].id, role: 'ADMIN' } })).status()).toBe(400);
	expect((await api.patch('/api/account', { headers: headers(), data: { email: actors[1].email } })).status()).toBe(409);
	const updated = await api.patch('/api/account', { headers: headers(), data: { name: `${mark} updated citizen` } });
	expect(updated.status()).toBe(200);
	expect((await updated.json()).user.id).toBe(actors[0].id);
	const saved = await api.patch('/api/settings', { headers: headers(), data: { emailComments: false, emailConfirmations: true, theme: 'light' } });
	expect(saved.status()).toBe(200);
	expect((await api.get('/api/settings', { headers: headers() }).then((response) => response.json())).preferences).toMatchObject({ emailComments: false, emailConfirmations: true, theme: 'light' });
	expect((await api.patch('/api/settings', { headers: headers(), data: { role: 'ADMIN' } })).status()).toBe(400);
	expect((await api.patch('/api/settings', { headers: headers(), data: { emailComments: 'true' } })).status()).toBe(400);
	const [neighbor] = await sql`select name from users where id=${actors[1].id}`;
	expect(neighbor.name).toBe(mark + ' NEIGHBOR');
});

test('native profile updates support photos, cover removal, public profiles and office details', async () => {
	const response = await api.post('/api/profile', { headers: headers(), multipart: { name: `${mark} profile`, avatar: { name: 'avatar.jpg', mimeType: 'image/jpeg', buffer: photo }, cover: { name: 'cover.jpg', mimeType: 'image/jpeg', buffer: photo } } });
	expect(response.status()).toBe(200);
	const profile = (await response.json()).profile;
	files.add(profile.avatarUrl); files.add(profile.coverUrl);
	expect((await api.get(new URL(profile.avatarUrl, origin).href)).status()).toBe(200);
	expect((await api.get('/api/profile', { headers: headers() }).then((response) => response.json())).isOwner).toBe(true);
	expect((await api.get(`/api/profiles/${actors[0].id.toUpperCase()}`, { headers: headers() }).then((response) => response.json())).isOwner).toBe(true);
	const publicProfile = await api.get(`/api/profiles/${actors[0].id}`);
	expect((await publicProfile.json()).isOwner).toBe(false);
	expect(await publicProfile.text()).not.toContain('PRIVATE-TEST-ID');
	expect((await api.post('/api/profile', { headers: { ...headers(), Origin: previewOrigin }, multipart: { name: `${mark} browser preview` } })).status()).toBe(200);
	expect((await api.post('/api/profile', { headers: { ...headers(), Origin: 'https://untrusted.example' }, multipart: { name: 'Untrusted form origin' } })).status()).toBe(403);
	expect((await api.post('/api/profile', { headers: headers(), multipart: { name: 'Citizen office', governmentLevel: 'MUNICIPAL', jurisdiction: 'Test municipality' } })).status()).toBe(403);
	expect((await api.post('/api/profile', { headers: headers(2), multipart: { name: `${mark} municipal office`, governmentLevel: 'MUNICIPAL', jurisdiction: 'Santa Cruz, Laguna', bio: 'Municipal infrastructure response.' } })).status()).toBe(200);
	expect((await api.post('/api/profile', { headers: headers(), multipart: { name: `${mark} profile`, removeAvatar: 'true', removeCover: 'true' } })).status()).toBe(200);
});

test('native assessment, draft ownership, publication, map lookup and discard use the existing report pipeline', async () => {
	const headline = `${mark} public access concern`;
	const caption = 'Visible surface deterioration beside the public entrance.';
	const multipart = { headline, caption, media: { name: 'infrastructure.jpg', mimeType: 'image/jpeg', buffer: photo } };
	expect((await api.post('/api/community/assess', { headers: { Origin: origin }, multipart })).status()).toBe(401);
	const assessed = await api.post('/api/community/assess', { headers: { ...headers(), 'X-Assessment-Id': randomUUID() }, multipart });
	expect(assessed.status(), await assessed.text()).toBe(200);
	const draft = await assessed.json();
	for (const item of draft.media) files.add(item.url);
	const input = { draftId: draft.draftId, coverId: draft.media[0].id, title: headline, body: caption, locationName: 'Mobile public entrance', latitude: 36.1234, longitude: 112.1234 };
	expect((await api.post('/api/community/posts', { headers: headers(1), data: input })).status()).toBe(404);
	expect((await api.post('/api/community/posts', { headers: headers(), data: { ...input, title: 'A different target' } })).status()).toBe(409);
	expect((await api.post('/api/community/posts', { headers: headers(), data: { ...input, road: { id: '123', start: 0, end: 501 } } })).status()).toBe(400);
	const published = await api.post('/api/community/posts', { headers: headers(), data: input });
	expect(published.status(), await published.text()).toBe(201);
	const post = await published.json();
	const retried = await api.post('/api/community/posts', { headers: headers(), data: input });
	expect(retried.status()).toBe(201);
	expect((await retried.json()).id).toBe(post.id);
	const details = await api.get(`/api/community/posts/${post.id}`, { headers: headers() });
	expect((await details.json()).post).toMatchObject({ title: headline, body: caption, reportId: post.reportId, author: { id: actors[0].id } });
	const hazard = await api.get(`/api/map/reports/${post.reportId}`);
	expect((await hazard.json()).hazard.posts.map((post: { id: string }) => post.id)).toContain(post.id);
	expect((await api.delete(`/api/community/drafts/${draft.draftId}`, { headers: headers() })).status()).toBe(204);
	expect((await api.get(draft.media[0].url)).status()).toBe(200);
	const second = await api.post('/api/community/assess', { headers: headers(), multipart });
	expect(second.status()).toBe(200);
	const unused = await second.json();
	for (const item of unused.media) files.add(item.url);
	expect((await api.delete(`/api/community/drafts/${unused.draftId}`, { headers: headers() })).status()).toBe(204);
	expect((await api.get(unused.media[0].url)).status()).toBe(404);
	expect((await api.post('/api/community/posts', { headers: headers(), data: { ...input, draftId: unused.draftId, coverId: unused.media[0].id } })).status()).toBe(410);
	expect((await api.get('/api/roads?lat=invalid&lng=121.4', { headers: headers() })).status()).toBe(400);
	expect((await api.get('/api/roads?lat=14.28&lng=121.42')).status()).toBe(401);
	expect((await api.post('/api/triage', { headers: headers(), multipart: { latitude: 'invalid', longitude: '121.4' } })).status()).toBe(400);
	expect((await api.post('/api/triage', { multipart: { latitude: 'invalid', longitude: '121.4' } })).status()).toBe(403);
});

test('native reactions, comments, replies, likes and reposts persist without changing hazard severity or support', async () => {
	const [before] = await sql`select hazard_severity,community_confirmations from reports where id=${reportIds[0]}`;
	for (let retry = 0; retry < 2; retry++) expect((await api.post(`/api/community/posts/${postIds[0]}`, { headers: headers(), data: { action: 'like', liked: true } })).status()).toBe(200);
	const liked = await api.get('/api/community/posts?tab=liked&q=' + mark, { headers: headers() });
	expect((await liked.json()).posts.some((post: { id: string }) => post.id === postIds[0])).toBe(true);
	const comment = await api.post(`/api/community/posts/${postIds[0]}`, { headers: headers(), data: { action: 'comment', body: 'Please inspect this localized damage.' } });
	expect(comment.status()).toBe(201);
	const id = (await comment.json()).comment.id;
	expect((await api.post(`/api/community/posts/${postIds[0]}`, { headers: headers(1), data: { action: 'comment', body: 'I can see the same spot.', parentId: id } })).status()).toBe(201);
	expect((await api.post(`/api/community/comments/${id}`, { headers: headers(1), data: { liked: true } })).status()).toBe(200);
	const thread = await api.get(`/api/community/posts/${postIds[0]}`, { headers: headers(1) });
	expect((await thread.json()).post.comments.find((comment: { id: string }) => comment.id === id)).toMatchObject({ likes: 1, userLiked: true, replies: 1 });
	const repostId = randomUUID();
	const payload = { id: repostId, postId: postIds[0], body: 'Sharing this report for follow-up.', image: { name: 'share.jpg', mimeType: 'image/jpeg', buffer: photo } };
	for (let retry = 0; retry < 2; retry++) expect((await api.post('/api/community/reposts', { headers: headers(), multipart: payload })).status()).toBe(201);
	const repost = await api.get(`/api/community/reposts/${repostId}`, { headers: headers() });
	expect(repost.status()).toBe(200);
	const data = (await repost.json()).repost;
	expect((await api.get(`/api/community/reposts/${repostId.toUpperCase()}`).then((response) => response.json())).repost.id).toBe(repostId);
	files.add(data.media[0].url);
	expect(data.post.id).toBe(postIds[0]);
	expect((await api.delete('/api/community/reposts?id=' + repostId, { headers: headers(1) })).status()).toBe(404);
	expect((await api.delete('/api/community/reposts?id=' + repostId, { headers: headers() })).status()).toBe(200);
	expect((await api.get(data.media[0].url)).status()).toBe(404);
	expect((await sql`select hazard_severity,community_confirmations from reports where id=${reportIds[0]}`)[0]).toEqual(before);
});

test('native government updates close every linked post, retain an explanation and support quote discussions and exports', async () => {
	expect((await api.get('/api/government/posts', { headers: headers() })).status()).toBe(403);
	expect((await api.get('/api/government/export', { headers: headers() })).status()).toBe(403);
	expect((await api.post('/api/community/government-media', { headers: headers(), multipart: { file: { name: 'proof.jpg', mimeType: 'image/jpeg', buffer: photo } } })).status()).toBe(403);
	const extra = await api.post('/api/community/government-media', { headers: headers(2), multipart: { file: { name: 'unused.jpg', mimeType: 'image/jpeg', buffer: photo } } }).then((response) => response.json());
	files.add(extra.media.url);
	expect((await api.delete('/api/community/government-media?id=' + extra.id, { headers: headers(3) })).status()).toBe(404);
	expect((await api.delete('/api/community/government-media?id=' + extra.id, { headers: headers(2) })).status()).toBe(200);
	expect((await api.get(extra.media.url)).status()).toBe(404);
	const evidence: string[] = [];
	for (const file of [{ name: 'repair.jpg', mimeType: 'image/jpeg', buffer: photo }, { name: 'repair-record.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\nIllustrative integration fixture\n%%EOF') }]) {
		const staged = await api.post('/api/community/government-media', { headers: headers(2), multipart: { file } });
		expect(staged.status()).toBe(201);
		const data = await staged.json(); evidence.push(data.id); files.add(data.media.url);
	}
	const id = randomUUID();
	const update = { id, postId: postIds[0], body: 'Municipal inspection and repair documented in the attached evidence.', status: 'RESOLVED', evidenceIds: JSON.stringify(evidence), budget: JSON.stringify([{ label: 'Illustrative materials', amount: 500 }]), budgetType: 'ACTUAL' };
	for (let retry = 0; retry < 2; retry++) expect((await api.post('/api/community/reposts', { headers: headers(2), multipart: update })).status()).toBe(201);
	expect((await api.delete('/api/community/government-media?id=' + evidence[0], { headers: headers(2) })).status()).toBe(404);
	for (const postId of postIds.slice(0, 2)) {
		const data = await api.get('/api/community/posts/' + postId).then((response) => response.json());
		expect(data.post.reportStatus).toBe('RESOLVED');
		expect(data.post.governmentUpdateLink).toContain(`repost=${id}`);
		expect(data.reposts.some((quote: { id: string }) => quote.id === id)).toBe(true);
	}
	expect((await api.get('/api/community/posts/' + postIds[2]).then((response) => response.json())).post.reportStatus).toBe('REPORTED');
	const governmentPost = (await api.get('/api/community/reposts/' + id).then((response) => response.json())).repost;
	expect(governmentPost.governmentUpdate).toMatchObject({ status: 'RESOLVED', budgetType: 'ACTUAL' });
	expect(governmentPost.governmentUpdate.attachments).toHaveLength(2);
	expect(governmentPost.post.media).toHaveLength(1);
	expect(governmentPost.post.latitude).toBe(14.28);
	expect((await api.post(`/api/community/reposts/${id}`, { headers: headers(), data: { action: 'like', liked: true } })).status()).toBe(200);
	const comment = await api.post(`/api/community/reposts/${id}`, { headers: headers(), data: { action: 'comment', body: 'Thank you for the repair evidence.' } });
	expect(comment.status()).toBe(200);
	const commentId = (await comment.json()).id;
	expect((await api.post(`/api/community/reposts/${id}`, { headers: headers(1), data: { action: 'comment', body: 'The update is helpful.', parentId: commentId } })).status()).toBe(200);
	expect((await api.post(`/api/community/reposts/${id}/comments/${commentId}`, { headers: headers(1), data: { liked: true } })).status()).toBe(200);
	const sharedId = randomUUID();
	expect((await api.post('/api/community/reposts', { headers: headers(), multipart: { id: sharedId, postId: postIds[0], quotedRepostId: id, body: 'Official resolution update.' } })).status()).toBe(201);
	expect((await api.get(`/api/community/reposts/${sharedId}`).then((response) => response.json())).repost.quotedRepost.id).toBe(id);
	expect((await api.delete('/api/community/reposts?id=' + id, { headers: headers(2) })).status()).toBe(404);
	const queue = await api.get('/api/government/posts?q=' + mark, { headers: headers(2) }).then((response) => response.json());
	expect(queue.posts.filter((post: { reportId: string }) => post.reportId === reportIds[0])).toHaveLength(1);
	const stats = await api.get(`/api/profiles/${actors[2].id}`).then((response) => response.json());
	expect(stats.statistics).toMatchObject({ reports: 1, resolved: 1 });
	const csv = await api.get('/api/government/export', { headers: headers(2) });
	expect(csv.status()).toBe(200);
	expect(csv.headers()['content-type']).toContain('text/csv');
	expect(await csv.text()).toContain('Illustrative materials');
	for (const attachment of governmentPost.governmentUpdate.attachments) expect((await api.get(attachment.url)).status()).toBe(200);
});

test('government approval, rejection and activation APIs enforce roles and revoke mobile sessions', async () => {
	expect((await api.get('/api/admin/accounts')).status()).toBe(401);
	expect((await api.get('/api/admin/accounts', { headers: headers() })).status()).toBe(403);
	const details = { role: 'OFFICER', department: 'Test municipal office', level: 'BARANGAY', jurisdiction: 'Test barangay', badgeNumber: 'PRIVATE-APPLICANT-ID' };
	expect((await register('incomplete-government', { role: 'OFFICER' })).status()).toBe(400);
	const registered = await register('government-applicant', details);
	expect(registered.status()).toBe(201);
	const pending = await registered.json();
	const pendingHeaders = { Authorization: `Bearer ${pending.accessToken}` };
	expect(pending.user.accountStatus).toBe('PENDING');
	expect((await api.get('/api/auth/session', { headers: pendingHeaders })).status()).toBe(200);
	expect((await api.get('/api/account', { headers: pendingHeaders })).status()).toBe(200);
	expect((await api.get('/api/government/posts', { headers: pendingHeaders })).status()).toBe(403);
	expect((await api.patch('/api/account', { headers: pendingHeaders, data: { name: 'Cannot bypass approval' } })).status()).toBe(403);
	const decide = (decision: string, id = pending.user.id) => api.patch('/api/admin/accounts/' + id, { headers: headers(4), data: { decision } });
	expect((await decide('approve', 'bad-id')).status()).toBe(400);
	expect((await decide('deactivate', actors[4].id)).status()).toBe(403);
	expect((await decide('activate')).status()).toBe(409);
	expect((await decide('approve')).status()).toBe(200);
	expect((await api.get('/api/government/posts', { headers: pendingHeaders })).status()).toBe(200);
	expect((await decide('approve')).status()).toBe(409);
	expect((await decide('deactivate')).status()).toBe(200);
	expect((await api.get('/api/auth/session', { headers: pendingHeaders })).status()).toBe(401);
	expect((await api.post('/api/auth/login', { data: { email: account('government-applicant'), password } })).status()).toBe(403);
	expect((await decide('activate')).status()).toBe(200);
	expect((await api.get('/api/auth/session', { headers: pendingHeaders })).status()).toBe(401);
	expect((await api.post('/api/auth/login', { data: { email: account('government-applicant'), password } })).status()).toBe(200);
	const rejected = await register('rejected-government', details).then((response) => response.json());
	expect((await decide('reject', rejected.user.id)).status()).toBe(200);
	expect((await api.get('/api/auth/session', { headers: { Authorization: `Bearer ${rejected.accessToken}` } })).status()).toBe(401);
	const signed = await api.post('/api/auth/login', { data: { email: account('rejected-government'), password } }).then((response) => response.json());
	expect(signed.user.accountStatus).toBe('REJECTED');
	expect((await api.post('/api/auth/logout', { headers: { Authorization: `Bearer ${signed.accessToken}` } })).status()).toBe(200);
	const administered = await api.get('/api/admin/accounts', { headers: headers(4) });
	expect(administered.status()).toBe(200);
	expect(await administered.text()).not.toContain('passwordHash');
});

test('password changes keep the current mobile session and revoke every other mobile and browser session', async ({ playwright }) => {
	const current = await login(1);
	const other = await login(1);
	const web = await playwright.request.newContext({ baseURL: origin });
	try {
		await web.post('/login', { headers: { Origin: origin, Accept: 'text/html' }, form: { email: actors[1].email, password }, maxRedirects: 0 });
		const next = 'ChangedMobilePass123!';
		const currentHeaders = { Authorization: `Bearer ${current.accessToken}` };
		expect((await api.post('/api/auth/password', { headers: currentHeaders, data: { currentPassword: 'incorrect', newPassword: next, confirmPassword: next } })).status()).toBe(400);
		const changed = await api.post('/api/auth/password', { headers: currentHeaders, data: { currentPassword: password, newPassword: next, confirmPassword: next } });
		expect(changed.status()).toBe(200);
		expect((await api.get('/api/auth/session', { headers: currentHeaders })).status()).toBe(200);
		expect((await api.get('/api/auth/session', { headers: { Authorization: `Bearer ${other.accessToken}` } })).status()).toBe(401);
		expect((await web.get('/api/auth/session', { headers: { Accept: 'application/json' } })).status()).toBe(401);
		expect((await api.post('/api/auth/login', { data: { email: actors[1].email, password } })).status()).toBe(401);
		expect((await login(1, next)).user.id).toBe(actors[1].id);
	} finally { await web.dispose(); }
});

test('password recovery delivers a real test email, keeps unknown accounts private and consumes reset tokens once', async () => {
	const response = await api.post('/api/auth/forgot-password', { data: { email: actors[5].email } });
	expect(response.status()).toBe(200);
	const unknown = await api.post('/api/auth/forgot-password', { data: { email: account('unknown-recovery') } });
	expect(await unknown.json()).toEqual(await response.json());
	await expect.poll(() => mailbox.messages.filter((message) => message.to.includes(actors[5].email)).length).toBe(1);
	const message = mailbox.messages.find((message) => message.to.includes(actors[5].email))!;
	const token = /#token=([a-f0-9]{64})/.exec(message.text)![1];
	expect(await sql`select token_hash from password_resets where token_hash=${token}`).toHaveLength(0);
	const next = 'RecoveredMobilePass123!';
	const reset = { token, newPassword: next, confirmPassword: next };
	expect((await api.post('/api/auth/reset-password', { data: reset })).status()).toBe(200);
	expect((await api.get('/api/auth/session', { headers: headers(5) })).status()).toBe(401);
	expect((await api.post('/api/auth/reset-password', { data: reset })).status()).toBe(400);
	expect((await api.post('/api/auth/login', { data: { email: actors[5].email, password: next } })).status()).toBe(200);
	expect((await api.post('/api/settings/reset-link', { headers: headers(4) })).status()).toBe(200);
	mailbox.rejectOne();
	const failure = await api.post('/api/settings/reset-link', { headers: headers(3) });
	expect(failure.status()).toBe(503);
});

test('only the owner can delete a source post and government history survives deletion', async () => {
	const staged = await api.post('/api/community/government-media', { headers: headers(2), multipart: { file: { name: 'retained-evidence.jpg', mimeType: 'image/jpeg', buffer: photo } } }).then((response) => response.json());
	files.add(staged.media.url);
	const official = await api.post('/api/community/reposts', { headers: headers(2), multipart: { id: randomUUID(), postId: postIds[0], body: 'Retain this official explanation after citizen deletion.', status: 'RESOLVED', evidenceIds: JSON.stringify([staged.id]), budget: '[]' } });
	expect(official.status()).toBe(201);
	expect((await api.delete(`/api/community/posts/${postIds[0]}`, { headers: headers(2) })).status()).toBe(404);
	const before = await api.get('/api/community/posts/' + postIds[0]).then((response) => response.json());
	const removed = await api.delete(`/api/community/posts/${postIds[0]}`, { headers: headers() });
	expect(removed.status()).toBe(200);
	expect(await removed.json()).toMatchObject({ deleted: true, retainedHazard: true });
	const retained = await api.get('/api/community/posts/' + postIds[0]).then((response) => response.json());
	expect(retained.post.deletedAt).toBeTruthy();
	expect(retained.post.media).toEqual([]);
	expect(retained.post.governmentUpdateLink).toBe(before.post.governmentUpdateLink);
	expect(retained.reposts.some((quote: { governmentUpdate: unknown }) => quote.governmentUpdate)).toBe(true);
	expect((await api.get('/api/map/reports/' + reportIds[0])).status()).toBe(200);
});

test('logout revokes only its own bearer credential and repeated login attempts are bounded', async () => {
	const first = await login();
	const second = await login();
	expect((await api.post('/api/auth/logout', { headers: { Authorization: `Bearer ${first.accessToken}` } })).status()).toBe(200);
	expect((await api.get('/api/auth/session', { headers: { Authorization: `Bearer ${first.accessToken}` } })).status()).toBe(401);
	expect((await api.get('/api/auth/session', { headers: { Authorization: `Bearer ${second.accessToken}` } })).status()).toBe(200);
	for (let attempt = 0; attempt < 20; attempt++) expect((await api.post('/api/auth/login', { data: { email: account('rate-limited'), password } })).status()).toBe(401);
	expect((await api.post('/api/auth/login', { data: { email: account('rate-limited'), password } })).status()).toBe(429);
});
