import { test, expect, type APIRequestContext } from '@playwright/test';
import postgres from 'postgres';
import { randomBytes, randomUUID } from 'node:crypto';

test.skip(process.env.SURIOS_TEST_NOTIFICATIONS_LIVE !== '1', 'Requires an explicitly isolated loopback notification backend and disposable database.');
test.describe.configure({ mode: 'serial' });
type Actor = { id: string; token: string };
let sql: ReturnType<typeof postgres>;
const actors: Actor[] = [], hazards = [randomUUID(), randomUUID()], posts = Array.from({ length: 4 }, () => randomUUID());
const pdf = Buffer.from('%PDF-1.4\n% explicitly labeled automated test fixture\n%%EOF');
const analysis = { isValidInfrastructure: true, infrastructureType: 'DRAINAGE_FLOOD_CANAL', distressType: 'drainage_cover_missing', hazardSeverity: 3, riskLevel: 'LOW', summary: 'Demo notification fixture.', recommendedAction: 'Inspect on site.', vruDetails: '', severityEvidence: { visibleDefects: ['Demo missing cover'], reportedConditions: [], criticalDangerVisible: false, confidence: 'MEDIUM', limitations: 'Demo fixture only.' } };
const headers = (i = 0) => ({ Authorization: `Bearer ${actors[i].token}` });
async function inbox(api: APIRequestContext, i = 0, query = '') {
	const response = await api.get(`/api/notifications${query}`, { headers: headers(i) });
	expect(response.status()).toBe(200); expect(response.headers()['cache-control']).toContain('no-store');
	return response.json();
}
async function comment(api: APIRequestContext, i: number, parentId?: string, postId = posts[0]) {
	const response = await api.post(`/api/community/posts/${postId}`, { headers: headers(i), data: { action: 'comment', body: 'Demo saved notification comment.', ...(parentId ? { parentId } : {}) } });
	expect(response.status()).toBe(201); return (await response.json()).comment.id as string;
}
async function official(api: APIRequestContext, status = 'RESOLVED', id = randomUUID()) {
	const response = await api.post('/api/community/reposts', { headers: headers(3), multipart: {
		id, postId: posts[1], body: 'Demo official response with supporting record.', status,
		evidence: { name: 'demo-record.pdf', mimeType: 'application/pdf', buffer: pdf }
	} });
	expect(response.status()).toBe(201); return (await response.json()).id as string;
}
test.beforeAll(async ({ request, baseURL }) => {
	if (process.env.SURIOS_TEST_NOTIFICATIONS_LIVE !== '1') return;
	const connection = new URL(process.env.DATABASE_URL || 'https://invalid');
	if (!baseURL || !['localhost', '127.0.0.1'].includes(new URL(baseURL).hostname) || !['localhost', '127.0.0.1'].includes(connection.hostname) || !connection.pathname.startsWith('/surios_mobile_notifications_'))
		throw new Error('Notification writes require the disposable loopback fixture, never Azure or the primary database.');
	sql = postgres(connection.toString(), { max: 1 });
	for (let i = 0; i < 4; i++) {
		const registered = await request.post('/api/auth/register', { data: { name: `Demo Notification Actor ${i}`, email: `notification-${randomUUID()}@example.test`, password: 'DemoNotification123!', confirmPassword: 'DemoNotification123!' } });
		expect(registered.status()).toBe(201);
		const data = await registered.json(); actors.push({ id: data.user.id, token: data.accessToken });
	}
	await sql`update users set role='OFFICER' where id=${actors[3].id}`;
	for (const id of hazards) await sql`insert into reports (id,image_path,latitude,longitude,distress_type,hazard_severity,risk_level,vru_lethality,recommended_action,triage_payload) values (${id}, '/samples/pothole-severe.jpg',14.28,121.42,'drainage_cover_missing',3,'LOW','LOW','Inspect on site.',${sql.json(analysis)})`;
	for (const [i, id] of posts.entries()) await sql`insert into community_posts (id,user_id,draft_id,report_id,title,body,location_name,latitude,longitude,media,cover_id,analysis) values (${id},${actors[i === 3 ? 2 : i === 1 ? 1 : 0].id},${randomUUID()},${hazards[i === 3 ? 1 : 0]},'Demo notification report','Demo fixture.','Demo Santa Cruz',14.28,121.42,'[]','',${sql.json(analysis)})`;
});
test.beforeEach(async () => {
	await sql`delete from notifications where user_id in ${sql(actors.map((a) => a.id))}`;
	await sql`delete from community_comments where post_id in ${sql(posts)}`;
	await sql`delete from community_reposts where post_id in ${sql(posts)}`;
	await sql`update reports set status='REPORTED' where id in ${sql(hazards)}`;
});
test.afterAll(async () => {
	if (!sql) return;
	await sql`delete from community_posts where id in ${sql(posts)}`;
	await sql`delete from reports where id in ${sql(hazards)}`;
	await sql`delete from users where id in ${sql(actors.map((a) => a.id))}`;
	await sql.end();
});

test('authentication, active accounts, origin validation and cookie CSRF protect the inbox', async ({ request }) => {
	expect((await request.get('/api/notifications')).status()).toBe(401);
	expect((await request.get('/api/notifications', { headers: { Authorization: 'Bearer invalid' } })).status()).toBe(401);
	expect((await request.get('/api/notifications', { headers: { ...headers(), Origin: 'https://untrusted.example.test' } })).status()).toBe(403);
	const cookie = randomBytes(32).toString('hex');
	await sql`insert into sessions (id,user_id,expires_at) values (${cookie},${actors[0].id},${new Date(Date.now()+60000)})`;
	expect((await request.patch('/api/notifications', { headers: { Cookie: `surios_session=${cookie}` }, data: { action: 'read-all' } })).status()).toBe(403);
	await sql`update users set account_status='PENDING' where id=${actors[0].id}`;
	expect((await request.get('/api/notifications', { headers: headers() })).status()).toBe(403);
	await sql`update users set account_status='ACTIVE' where id=${actors[0].id}`;
	expect((await inbox(request)).items).toEqual([]);
});

test('official updates notify each linked author once and point to the actual sibling update', async ({ request }) => {
	const id = await official(request);
	for (const i of [0, 1]) {
		const saved = await inbox(request, i);
		expect(saved.unreadCount).toBe(1); expect(saved.items).toHaveLength(1);
		expect(saved.items[0]).toMatchObject({ kind: 'REPORT_RESOLVED', postId: posts[1], repostId: id, readAt: null });
		expect(saved.items[0].actor.id).toBe(actors[3].id); expect(saved.items[0].actor).not.toHaveProperty('email');
		const thread = await request.get(`/api/community/posts/${saved.items[0].postId}`, { headers: headers(i) });
		expect((await thread.json()).reposts.some((q: { id: string }) => q.id === id)).toBe(true);
	}
	expect((await inbox(request, 2)).unreadCount).toBe(0); expect((await inbox(request, 3)).unreadCount).toBe(0);
	const state = await sql`select id,status,hazard_severity from reports where id in ${sql(hazards)}`;
	expect(state.find((r) => r.id === hazards[0])).toMatchObject({ status: 'RESOLVED', hazard_severity: 3 });
	expect(state.find((r) => r.id === hazards[1]).status).toBe('REPORTED');
});

test('retried official updates do not duplicate notifications and reopening has its own progress event', async ({ request }) => {
	const id = randomUUID(); await official(request, 'RESOLVED', id); await official(request, 'RESOLVED', id);
	expect((await inbox(request)).items).toHaveLength(1);
	await official(request, 'IN_PROGRESS');
	expect((await inbox(request)).items.map((n: { kind: string }) => n.kind)).toEqual(['REPORT_PROGRESS', 'REPORT_RESOLVED']);
});

test('source comments and replies deduplicate recipients and omit self-notifications', async ({ request }) => {
	const parent = await comment(request, 1);
	expect((await inbox(request)).items[0]).toMatchObject({ kind: 'COMMENT', commentId: parent, repostId: null });
	expect((await inbox(request, 1)).unreadCount).toBe(0);
	const reply = await comment(request, 2, parent);
	expect((await inbox(request)).items[0]).toMatchObject({ kind: 'COMMENT', commentId: reply });
	expect((await inbox(request, 1)).items[0]).toMatchObject({ kind: 'REPLY', commentId: reply });
	expect((await inbox(request, 2)).unreadCount).toBe(0);
	const ownParent = await comment(request, 0);
	const ownerReply = await comment(request, 1, ownParent);
	expect((await inbox(request)).items.filter((n: { commentId: string }) => n.commentId === ownerReply)).toHaveLength(1);
	expect((await inbox(request)).items[0].kind).toBe('REPLY');
});

test('government-update discussions notify the update author and parent author independently of the source', async ({ request }) => {
	const id = await official(request);
	await sql`delete from notifications where user_id in ${sql(actors.map((a) => a.id))}`;
	const first = await request.post(`/api/community/reposts/${id}`, { headers: headers(1), data: { action: 'comment', body: 'Demo question about repair evidence.' } });
	expect(first.status()).toBe(200); const parent = (await first.json()).id;
	expect((await inbox(request, 3)).items[0]).toMatchObject({ postId: posts[1], repostId: id, kind: 'COMMENT', commentId: parent });
	expect((await inbox(request)).unreadCount).toBe(0);
	const reply = await request.post(`/api/community/reposts/${id}`, { headers: headers(2), data: { action: 'comment', body: 'Demo reply.', parentId: parent } });
	expect(reply.status()).toBe(200);
	expect((await inbox(request, 1)).items[0].kind).toBe('REPLY');
	expect((await inbox(request, 3)).unreadCount).toBe(2);
	expect((await inbox(request, 2)).unreadCount).toBe(0);
});

test('read receipts enforce ownership, are idempotent and preserve other users and future events', async ({ request }) => {
	await official(request); const a = (await inbox(request)).items[0];
	expect((await request.patch('/api/notifications', { headers: headers(1), data: { action: 'read', id: a.id } })).status()).toBe(404);
	expect((await inbox(request)).unreadCount).toBe(1);
	const read = await request.patch('/api/notifications', { headers: headers(), data: { action: 'read', id: a.id } });
	expect(read.status()).toBe(200); const result = await read.json(); expect(result.unreadCount).toBe(0);
	const retry = await request.patch('/api/notifications', { headers: headers(), data: { action: 'read', id: a.id } });
	expect((await retry.json()).readAt).toBe(result.readAt);
	expect((await inbox(request, 1)).unreadCount).toBe(1);
	await request.patch('/api/notifications', { headers: headers(1), data: { action: 'read-all' } });
	expect((await inbox(request, 1)).unreadCount).toBe(0);
	await comment(request, 0, undefined, posts[1]);
	expect((await inbox(request, 1)).unreadCount).toBe(1);
});

test('keyset pagination handles tied timestamps without duplicates and unread filters are accurate', async ({ request }) => {
	for (let i = 0; i < 25; i++) await comment(request, 1);
	await sql`update notifications set created_at=${new Date('2026-10-25T00:00:00.000Z')} where user_id=${actors[0].id}`;
	let page = await inbox(request, 0, '?limit=10'), ids: string[] = [];
	expect(page.unreadCount).toBe(25);
	while (true) {
		ids.push(...page.items.map((n: { id: string }) => n.id));
		if (!page.nextCursor) break;
		page = await inbox(request, 0, `?limit=10&cursor=${page.nextCursor}`);
	}
	expect(ids).toHaveLength(25); expect(new Set(ids).size).toBe(25);
	await request.patch('/api/notifications', { headers: headers(), data: { action: 'read', id: ids[0] } });
	const unread = await inbox(request, 0, '?filter=unread&limit=50');
	expect(unread.unreadCount).toBe(24); expect(unread.items).toHaveLength(24); expect(unread.items.every((n: { readAt: string | null }) => n.readAt === null)).toBe(true);
});

test('invalid requests and failed mutations do not create notifications', async ({ request }) => {
	for (const suffix of ['?cursor=bad', '?limit=-1', '?limit=51', '?filter=other']) expect((await request.get(`/api/notifications${suffix}`, { headers: headers() })).status()).toBe(400);
	expect((await request.patch('/api/notifications', { headers: headers(), data: { action: 'read', id: randomUUID(), userId: actors[1].id } })).status()).toBe(400);
	expect((await request.post(`/api/community/posts/${posts[0]}`, { headers: headers(1), data: { action: 'comment', body: 'Demo invalid parent.', parentId: randomUUID() } })).status()).toBe(400);
	expect((await inbox(request)).unreadCount).toBe(0);
});
