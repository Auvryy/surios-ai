import fs from 'node:fs/promises';
import path from 'node:path';
import { and, eq, sql } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import { z } from 'zod';
import { db, users, reports, workOrderEvents, communityComments, communityPosts } from './db';
import { communityCommentLikes, communityReposts } from './db/community-social-schema';
import { isGovernment, type GovernmentUpdate } from '$lib/types/community';
import { governmentUpdateSchema, prepareGovernmentAttachments, writeGovernmentAttachments, removeGovernmentAttachments } from './government-updates';
import { MEDIA_DIR, readUploadForm, removeMedia, validateMedia } from './community-media';

export async function saveRepost(request: Request, userId: string) {
	const form = await readUploadForm(request);
	const parsed = z.object({ id: z.uuid(), postId: z.uuid(), body: z.string().trim().max(1000) }).safeParse({ id: form.get('id'), postId: form.get('postId'), body: form.get('body') || '' });
	if (!parsed.success) error(400, 'Choose a post and write up to 1,000 characters.');
	const input = parsed.data;
	const [source] = await db.select({ id: communityPosts.id, reportId: communityPosts.reportId }).from(communityPosts).where(eq(communityPosts.id, input.postId));
	if (!source) error(404, 'Original post not found.');
	const [existing] = await db.select().from(communityReposts).where(eq(communityReposts.id, input.id));
	if (existing) {
		if (existing.userId !== userId || existing.postId !== input.postId) error(409, 'This repost request is already in use.');
		return existing;
	}
	const [actor] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId));
	if (form.has('status')) {
		if (!isGovernment(actor.role)) error(403, 'Only government accounts can publish official updates.');
		let budget: unknown;
		try { budget = JSON.parse(String(form.get('budget') || '[]')); } catch { error(400, 'Invalid budget breakdown.'); }
		const update = governmentUpdateSchema.safeParse({ status: form.get('status'), budget, budgetType: form.get('budgetType') || 'ESTIMATED' });
		if (!update.success || !input.body) error(400, 'Add update details, a valid status and a budget with positive amounts and up to two decimal places.');
		const uploads = await prepareGovernmentAttachments(form.getAll('evidence').filter((entry) => !(entry instanceof File && !entry.size)));
		try {
			await writeGovernmentAttachments(uploads);
			const result = await db.transaction(async (tx) => {
				await tx.select({ id: reports.id }).from(reports).where(eq(reports.id, source.reportId)).for('update');
				const governmentUpdate: GovernmentUpdate = { ...update.data, attachments: uploads.map((upload) => upload.media) };
				const [saved] = await tx.insert(communityReposts).values({ ...input, userId, media: [], governmentUpdate, createdAt: sql`clock_timestamp()` }).onConflictDoNothing().returning();
				if (!saved) return null;
				const resolvedImagePath = update.data.status === 'RESOLVED' ? uploads.find((upload) => upload.media.kind === 'photo')?.media.url || null : null;
				await tx.update(reports).set({ status: update.data.status === 'RESOLVED' ? 'RESOLVED' : 'IN_REPAIR', resolvedImagePath, updatedAt: new Date() }).where(eq(reports.id, source.reportId));
				await tx.insert(workOrderEvents).values({ reportId: source.reportId, actorId: userId, event: update.data.status, description: input.body, imagePath: uploads[0].media.url });
				return saved;
			});
			if (result) return result;
			await removeGovernmentAttachments(uploads);
			const [retry] = await db.select().from(communityReposts).where(and(eq(communityReposts.id, input.id), eq(communityReposts.userId, userId), eq(communityReposts.postId, input.postId)));
			if (!retry) error(409, 'This update request is already in use.');
			return retry;
		} catch (cause) { await removeGovernmentAttachments(uploads); throw cause; }
	}
	const files = form.getAll('image').filter((entry) => !(entry instanceof File && entry.size === 0));
	if (files.length > 1) error(400, 'A repost can include at most one image.');
	if (files.some((entry) => !(entry instanceof File) || !['image/jpeg', 'image/png', 'image/webp'].includes(entry.type))) error(400, 'Use one JPEG, PNG, or WebP image. Videos are not allowed in reposts.');
	if (files.some((entry) => (entry as File).size > 4 * 1024 * 1024)) error(413, 'The repost image must be 4 MB or less.');
	const uploads = files.length ? await validateMedia(files) : [];
	await fs.mkdir(MEDIA_DIR, { recursive: true });
	try {
		for (const upload of uploads) await fs.writeFile(path.join(MEDIA_DIR, upload.filename), upload.buffer, { flag: 'wx' });
		const [saved] = await db.insert(communityReposts).values({ ...input, userId, media: uploads.map((upload) => upload.media) }).onConflictDoNothing().returning();
		if (saved) return saved;
		await removeMedia(uploads.map((upload) => upload.media));
		const [retried] = await db.select().from(communityReposts).where(and(eq(communityReposts.id, input.id), eq(communityReposts.userId, userId), eq(communityReposts.postId, input.postId)));
		if (!retried) error(409, 'This repost request is already in use.');
		return retried;
	} catch (cause) { await removeMedia(uploads.map((upload) => upload.media)); throw cause; }
}

export async function setCommentLike(commentId: string, userId: string, liked: boolean) {
	const [comment] = await db.select({ id: communityComments.id }).from(communityComments).where(eq(communityComments.id, commentId));
	if (!comment) error(404, 'Comment not found.');
	if (liked) await db.insert(communityCommentLikes).values({ commentId, userId }).onConflictDoNothing();
	else await db.delete(communityCommentLikes).where(and(eq(communityCommentLikes.commentId, commentId), eq(communityCommentLikes.userId, userId)));
	const [result] = await db.select({ likes: sql<number>`count(*)::int` }).from(communityCommentLikes).where(eq(communityCommentLikes.commentId, commentId));
	return { likes: result.likes, userLiked: liked };
}
