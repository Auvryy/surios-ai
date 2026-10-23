import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { reporterContext, suggestedHeadline } from '$lib/types/assessment';
import { beginAssessment, finishAssessment, discardAssessment } from '$lib/server/community-assessments';
import { error, json } from '@sveltejs/kit';
import { and, eq, gt, sql } from 'drizzle-orm';
import fs from 'node:fs/promises';
import path from 'node:path';
import { db, communityDrafts } from '$lib/server/db';
import { requireCommunityUser } from '$lib/server/community';
import { MEDIA_DIR, readUploadForm, validateMedia, removeMedia, cleanExpiredDrafts } from '$lib/server/community-media';
import { normalizeSeverity } from '$lib/types/hazards';
import { analyzeRoadMedia } from '$lib/server/gemini';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	const user = requireCommunityUser(event);
	const id = event.request.headers.get('x-assessment-id') || randomUUID();
	if (!z.uuid().safeParse(id).success) error(400, 'Invalid assessment request.');
	const job = beginAssessment(user.id, id);
	const signal = job.controller.signal;
	let created = false;
	const checkCancelled = () => { if (signal.aborted) error(409, 'Assessment cancelled. You can assess again.'); };
	let saved: Awaited<ReturnType<typeof validateMedia>> = [];
	try {
		const [quota] = await db.select({ count: sql<number>`count(*)::int` }).from(communityDrafts)
			.where(and(eq(communityDrafts.userId, user.id), gt(communityDrafts.createdAt, new Date(Date.now() - 3600000))));
		if (quota.count >= 12) error(429, 'You have reached 12 assessments this hour. Try again later.');
		const form = await readUploadForm(event.request);
		const files = await validateMedia(form.getAll('media'));
		let analysis;
		const structured = form.has('headline') || form.has('caption');
		const text = (key: string) => typeof form.get(key) === 'string' ? String(form.get(key)) : '';
		const context = structured ? reporterContext(text('headline'), text('caption')) : reporterContext('', text('context'));
		checkCancelled();
		try { analysis = normalizeSeverity(await analyzeRoadMedia(files.map(({ buffer, media }) => ({ buffer, mimeType: media.mimeType })), context, signal)); }
		catch (cause) { checkCancelled(); console.error('[Community AI]', cause instanceof Error ? cause.message : 'Assessment failed'); error(503, 'AI assessment is unavailable. Your attachments remain in this form; please try again shortly.'); }
		checkCancelled();
		if (!analysis.isValidInfrastructure) return json({ error: analysis.rejectionReason || 'These attachments do not show recognizable public infrastructure.', analysis }, { status: 422 });
		await fs.mkdir(MEDIA_DIR, { recursive: true });
		for (const file of files) {
			saved.push(file);
			await fs.writeFile(path.join(MEDIA_DIR, file.filename), file.buffer, { flag: 'wx' });
		}
		checkCancelled();
		const effectiveContext = { ...context, headline: context.headline || suggestedHeadline(analysis.distressType) };
		const [draft] = await db.insert(communityDrafts).values({ id, reporterContext: structured ? effectiveContext : null, userId: user.id, media: files.map(({ media }) => media), analysis, expiresAt: new Date(Date.now() + 86400000) }).returning();
		created = true;
		checkCancelled();
		saved = [];
		await cleanExpiredDrafts().catch(() => console.warn('[Community] Draft cleanup will retry on the next assessment.'));
		return json({ draftId: draft.id, media: draft.media, analysis, context: structured ? effectiveContext : null });
	} finally {
		finishAssessment(user.id, job);
		if (signal.aborted && created) await discardAssessment(user.id, id);
		if (saved.length) await removeMedia(saved.map(({ media }) => media));
	}
};
