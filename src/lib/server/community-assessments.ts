import { error } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db, communityDrafts, communityPosts } from './db';
import { removeMedia } from './community-media';
import { reporterContext, sameReporterContext } from '$lib/types/assessment';

const jobs = new Map<string, { id: string; controller: AbortController }>();
const cancelled = new Map<string, { id: string; until: number }>();
export function beginAssessment(userId: string, id: string) {
	for (const [key, value] of cancelled) if (value.until < Date.now()) cancelled.delete(key);
	if (cancelled.get(userId)?.id === id) error(409, 'This assessment was cancelled. Start a new assessment.');
	if (jobs.has(userId)) error(429, 'Your previous assessment is still running. Cancel it or wait for it to finish.');
	const job = { id, controller: new AbortController() };
	jobs.set(userId, job);
	return job;
}
export function cancelAssessment(userId: string, id: string) {
	cancelled.set(userId, { id, until: Date.now() + 60000 });
	const job = jobs.get(userId);
	if (job?.id === id) { job.controller.abort(); jobs.delete(userId); }
}
export function finishAssessment(userId: string, job: ReturnType<typeof beginAssessment>) {
	if (jobs.get(userId) === job) jobs.delete(userId);
}
export function assertCurrentDraft(draft: typeof communityDrafts.$inferSelect, title: string, body: string) {
	if (draft.discardedAt) error(410, 'This assessment was discarded. Assess your current attachments again.');
	if (draft.expiresAt <= new Date()) error(410, 'This assessment expired. Assess your attachments again.');
	if (draft.reporterContext && !sameReporterContext(draft.reporterContext, reporterContext(title, body))) {
		error(409, 'Your headline or caption changed. Assess again so AI can consider the updated context.');
	}
}
export async function discardAssessment(userId: string, id: string) {
	const media = await db.transaction(async tx => {
		const [draft] = await tx.select().from(communityDrafts).where(and(eq(communityDrafts.id, id), eq(communityDrafts.userId, userId))).for('update');
		if (!draft) return [];
		const [post] = await tx.select({ id: communityPosts.id }).from(communityPosts).where(eq(communityPosts.draftId, id));
		if (post) return []; // Publishing owns these files now; never remove its evidence.
		await tx.update(communityDrafts).set({ discardedAt: new Date() }).where(eq(communityDrafts.id, id));
		return draft.media;
	});
	// Retain the row until its original expiry so discarding cannot reset hourly quota.
	await removeMedia(media);
	if (media.length) await db.update(communityDrafts).set({ media: [] }).where(and(eq(communityDrafts.id, id), eq(communityDrafts.userId, userId)));
}
