import postgres from 'postgres';
import { createHash, randomBytes, scryptSync } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const uploadRoot = path.join(root, 'static', 'uploads');
const assetRoot = path.join(root, 'static', 'presentation-seed', 'assets');
const fixturePath = path.join(root, 'scripts', 'fixtures', 'presentation-snapshot.json');
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5433/surios';
const demoPassword = process.env.PRESENTATION_SEED_PASSWORD || 'Password123!';
const sql = postgres(connectionString, { max: 1, idle_timeout: 5 });
const createdFiles = [];

const coreTables = [
	['reports', 'reports'],
	['report_observations', 'observations'],
	['community_posts', 'posts'],
	['community_comments', 'comments'],
	['community_reposts', 'reposts'],
	['work_order_events', 'workOrderEvents']
];

function json(tx, value) {
	return value == null ? null : tx.json(value);
}

function collectUploadUrls(value, urls = new Set()) {
	if (typeof value === 'string' && (value.startsWith('/media/') || value.startsWith('/uploads/'))) urls.add(value);
	else if (Array.isArray(value)) for (const item of value) collectUploadUrls(item, urls);
	else if (value && typeof value === 'object') for (const item of Object.values(value)) collectUploadUrls(item, urls);
	return urls;
}

function mediaDestination(url) {
	if (url.startsWith('/media/')) {
		const name = url.slice('/media/'.length);
		if (!/^[0-9a-f-]{36}\.(jpg|png|webp|mp4|webm|mov|pdf)$/i.test(name)) throw new Error(`Unsupported seeded media URL: ${url}`);
		return path.join(uploadRoot, 'community', name);
	}
	if (url.startsWith('/uploads/')) {
		const name = url.slice('/uploads/'.length);
		if (!/^[A-Za-z0-9._-]{1,180}$/.test(name) || name.includes('..')) throw new Error(`Unsupported seeded upload URL: ${url}`);
		return path.join(uploadRoot, name);
	}
	throw new Error(`Unsupported seeded media URL: ${url}`);
}

function verifySnapshotReferences(snapshot) {
	if (snapshot.version !== 1 || !Array.isArray(snapshot.assets) || !Array.isArray(snapshot.reports) || !Array.isArray(snapshot.posts)) {
		throw new Error('Unsupported or incomplete presentation snapshot.');
	}
	const expected = collectUploadUrls(snapshot);
	const supplied = new Map();
	for (const asset of snapshot.assets) {
		if (!/^[0-9a-f]{64}\.(jpg|jpeg|png|webp|pdf|mp4|webm|mov)$/i.test(asset.file)) throw new Error(`Invalid asset filename: ${asset.file}`);
		if (supplied.has(asset.url)) throw new Error(`Duplicate asset mapping: ${asset.url}`);
		supplied.set(asset.url, asset);
	}
	for (const url of expected) if (!supplied.has(url)) throw new Error(`Snapshot media is missing an asset: ${url}`);
	for (const url of supplied.keys()) if (!expected.has(url)) throw new Error(`Snapshot contains an unused asset reference: ${url}`);
}

async function materializeAssets(snapshot) {
	for (const asset of snapshot.assets) {
		const source = path.resolve(assetRoot, asset.file);
		if (!source.startsWith(`${assetRoot}${path.sep}`)) throw new Error(`Invalid asset source: ${asset.file}`);
		const bytes = await readFile(source);
		const digest = createHash('sha256').update(bytes).digest('hex');
		if (digest !== asset.sha256 || bytes.length !== asset.bytes) throw new Error(`Seed asset failed integrity check: ${asset.file}`);

		const target = path.resolve(mediaDestination(asset.url));
		if (!target.startsWith(`${uploadRoot}${path.sep}`)) throw new Error(`Invalid upload destination: ${asset.url}`);
		try {
			const existing = await readFile(target);
			if (createHash('sha256').update(existing).digest('hex') !== asset.sha256) {
				throw new Error(`Existing upload differs from the snapshot; leaving it untouched: ${asset.url}`);
			}
		} catch (cause) {
			if (cause?.code !== 'ENOENT') throw cause;
			await mkdir(path.dirname(target), { recursive: true });
			await writeFile(target, bytes, { flag: 'wx' });
			createdFiles.push(target);
		}
	}
}

async function findRowsByIds(tx, table, rows) {
	if (!rows.length) return [];
	const ids = rows.map((row) => row.id);
	const placeholders = ids.map((_, index) => `$${index + 1}::uuid`).join(', ');
	return tx.unsafe(`select id from ${table} where id in (${placeholders})`, ids);
}

async function getSnapshotState(tx, snapshot) {
	let anyContent = false;
	let allExpectedPresent = true;
	for (const [table, key] of coreTables) {
		const rows = snapshot[key] || [];
		const [{ count }] = await tx.unsafe(`select count(*)::int as count from ${table}`);
		if (count > 0) anyContent = true;
		const found = await findRowsByIds(tx, table, rows);
		if (found.length !== rows.length) allExpectedPresent = false;
	}
	return { anyContent, allExpectedPresent };
}

async function ensureAccounts(tx, snapshot) {
	const ids = new Map();
	for (const user of snapshot.users) {
		const [byEmail] = await tx`select id,email,role from users where email = ${user.email}`;
		if (byEmail) {
			if (byEmail.role !== user.role) throw new Error(`Existing account ${user.email} has a different role; no account changes were made.`);
			ids.set(user.id, byEmail.id);
			continue;
		}
		const [byId] = await tx`select id,email from users where id = ${user.id}`;
		if (byId) throw new Error(`Seed account ID ${user.id} is already used by ${byId.email}.`);
		const salt = randomBytes(16).toString('hex');
		const passwordHash = `${salt}:${scryptSync(demoPassword, salt, 64).toString('hex')}`;
		await tx`insert into users (id,email,name,password_hash,role,department,badge_number,avatar_url,cover_url,government_profile,settings,created_at,updated_at)
			values (${user.id},${user.email},${user.name},${passwordHash},${user.role},${user.department},${user.badgeNumber},${user.avatarUrl},${user.coverUrl},${json(tx,user.governmentProfile)},${json(tx,user.settings)},${user.createdAt},${user.updatedAt})
			on conflict do nothing`;
		const [created] = await tx`select id,role from users where email = ${user.email}`;
		if (!created || created.role !== user.role) throw new Error(`Could not create presentation account ${user.email}.`);
		ids.set(user.id, created.id);
	}
	return ids;
}

function userId(ids, id) {
	if (id == null) return null;
	const mapped = ids.get(id);
	if (!mapped) throw new Error(`Snapshot references an account not included in its fixture: ${id}`);
	return mapped;
}

async function insertSnapshot(tx, snapshot, ids) {
	for (const row of snapshot.reports) await tx`insert into reports
		(id,image_path,latitude,longitude,distress_type,hazard_severity,risk_level,vru_lethality,vru_details,recommended_action,materials_checklist,status,community_confirmations,resolved_image_path,triage_payload,created_at,updated_at)
		values (${row.id},${row.imagePath},${row.latitude},${row.longitude},${row.distressType},${row.hazardSeverity},${row.riskLevel},${row.vruLethality},${row.vruDetails},${row.recommendedAction},${json(tx,row.materialsChecklist)},${row.status},${row.communityConfirmations},${row.resolvedImagePath},${json(tx,row.triagePayload)},${row.createdAt},${row.updatedAt}) on conflict do nothing`;

	for (const row of snapshot.posts) await tx`insert into community_posts
		(id,user_id,draft_id,report_id,title,body,location_name,latitude,longitude,media,cover_id,analysis,created_at,road_segment,deleted_at)
		values (${row.id},${userId(ids,row.userId)},${row.draftId},${row.reportId},${row.title},${row.body},${row.locationName},${row.latitude},${row.longitude},${json(tx,row.media)},${row.coverId},${json(tx,row.analysis)},${row.createdAt},${json(tx,row.roadSegment)},${row.deletedAt}) on conflict do nothing`;

	for (const row of snapshot.observations) await tx`insert into report_observations
		(id,report_id,source_id,user_id,observer_key,analysis,media,fingerprints,match,created_at)
		values (${row.id},${row.reportId},${row.sourceId},${userId(ids,row.userId)},${row.observerKey},${json(tx,row.analysis)},${json(tx,row.media)},${json(tx,row.fingerprints)},${json(tx,row.match)},${row.createdAt}) on conflict do nothing`;

	for (const row of snapshot.comments) await tx`insert into community_comments (id,post_id,user_id,parent_id,body,created_at)
		values (${row.id},${row.postId},${userId(ids,row.userId)},${row.parentId},${row.body},${row.createdAt}) on conflict do nothing`;

	for (const row of snapshot.reposts) await tx`insert into community_reposts (id,user_id,post_id,body,media,government_update,quoted_repost_id,created_at)
		values (${row.id},${userId(ids,row.userId)},${row.postId},${row.body},${json(tx,row.media)},${json(tx,row.governmentUpdate)},${row.quotedRepostId},${row.createdAt}) on conflict do nothing`;

	for (const row of snapshot.confirmations) await tx`insert into community_confirmations (post_id,user_id,created_at)
		values (${row.postId},${userId(ids,row.userId)},${row.createdAt}) on conflict do nothing`;
	for (const row of snapshot.commentLikes) await tx`insert into community_comment_likes (comment_id,user_id,created_at)
		values (${row.commentId},${userId(ids,row.userId)},${row.createdAt}) on conflict do nothing`;
	for (const row of snapshot.quoteComments) await tx`insert into community_quote_comments (id,repost_id,user_id,parent_id,body,created_at)
		values (${row.id},${row.repostId},${userId(ids,row.userId)},${row.parentId},${row.body},${row.createdAt}) on conflict do nothing`;
	for (const row of snapshot.quoteLikes) await tx`insert into community_quote_likes (repost_id,user_id,created_at)
		values (${row.repostId},${userId(ids,row.userId)},${row.createdAt}) on conflict do nothing`;
	for (const row of snapshot.quoteCommentLikes) await tx`insert into community_quote_comment_likes (comment_id,user_id,created_at)
		values (${row.commentId},${userId(ids,row.userId)},${row.createdAt}) on conflict do nothing`;
	for (const row of snapshot.workOrderEvents) await tx`insert into work_order_events (id,report_id,actor_id,event,description,image_path,created_at)
		values (${row.id},${row.reportId},${userId(ids,row.actorId)},${row.event},${row.description},${row.imagePath},${row.createdAt}) on conflict do nothing`;
}

try {
	if (demoPassword.length < 12) throw new Error('Presentation seed password must be at least 12 characters.');
	const snapshot = JSON.parse(await readFile(fixturePath, 'utf8'));
	verifySnapshotReferences(snapshot);
	await sql.begin(async (tx) => {
		await tx`select pg_advisory_xact_lock(76489215)`;
		const state = await getSnapshotState(tx, snapshot);
		if (state.anyContent && !state.allExpectedPresent) {
			throw new Error('The target database already contains different report/community content. Use an empty presentation database or one that already contains this complete snapshot; no rows were inserted.');
		}
		await materializeAssets(snapshot);
		if (state.allExpectedPresent) {
			console.log('Presentation snapshot already exists; existing posts and interactions were retained. Missing snapshot media was restored if needed.');
			return;
		}
		const ids = await ensureAccounts(tx, snapshot);
		await insertSnapshot(tx, snapshot, ids);
		console.log(`Seeded ${snapshot.reports.length} reports, ${snapshot.posts.length} posts, ${snapshot.comments.length} comments, ${snapshot.reposts.length} reposts, road sections, interactions, official updates and media.`);
	});
	createdFiles.length = 0;
} catch (cause) {
	await Promise.all(createdFiles.map((file) => rm(file, { force: true })));
	if (cause?.code === '42P01') throw new Error('Presentation seed requires the complete database schema. Apply migrations 0000–0011 first.', { cause });
	throw cause;
} finally {
	await sql.end();
}
