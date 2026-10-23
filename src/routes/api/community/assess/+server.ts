import { error, json } from '@sveltejs/kit';
import { and, eq, gt, sql } from 'drizzle-orm';
import fs from 'node:fs/promises';
import path from 'node:path';
import { db, communityDrafts } from '$lib/server/db';
import { requireCommunityUser } from '$lib/server/community';
import { MEDIA_DIR, readUploadForm, validateMedia, removeMedia, cleanExpiredDrafts } from '$lib/server/community-media';
import { analyzeRoadMedia } from '$lib/server/gemini';
import type { RequestHandler } from './$types';

const active = new Set<string>();
export const POST: RequestHandler = async (event) => {
	const user = requireCommunityUser(event);
	if (active.has(user.id)) error(429, 'Your previous assessment is still running.');
	active.add(user.id);
	let saved: Awaited<ReturnType<typeof validateMedia>> = [];
	try {
		const [quota] = await db.select({ count: sql<number>`count(*)::int` }).from(communityDrafts)
			.where(and(eq(communityDrafts.userId, user.id), gt(communityDrafts.createdAt, new Date(Date.now() - 3600000))));
		if (quota.count >= 12) error(429, 'You have reached 12 assessments this hour. Try again later.');
		const form = await readUploadForm(event.request);
		const files = await validateMedia(form.getAll('media'));
		let analysis;
		try { analysis = await analyzeRoadMedia(files.map(({ buffer, media }) => ({ buffer, mimeType: media.mimeType }))); }
		catch (cause) { console.error('[Community AI]', cause instanceof Error ? cause.message : 'Assessment failed'); error(503, 'AI assessment is unavailable. Your draft is still here; please try again shortly.'); }
		if (!analysis.isValidInfrastructure) return json({ error: analysis.rejectionReason || 'These attachments do not show a public road hazard.', analysis }, { status: 422 });
		await fs.mkdir(MEDIA_DIR, { recursive: true });
		for (const file of files) {
			saved.push(file);
			await fs.writeFile(path.join(MEDIA_DIR, file.filename), file.buffer, { flag: 'wx' });
		}
		const [draft] = await db.insert(communityDrafts).values({ userId: user.id, media: files.map(({ media }) => media), analysis, expiresAt: new Date(Date.now() + 86400000) }).returning();
		saved = [];
		await cleanExpiredDrafts().catch(() => console.warn('[Community] Draft cleanup will retry on the next assessment.'));
		return json({ draftId: draft.id, media: draft.media, analysis });
	} finally {
		active.delete(user.id);
		if (saved.length) await removeMedia(saved.map(({ media }) => media));
	}
};
