import { queuePostEmail } from '$lib/server/email';
import { notifyComment } from '$lib/server/notifications';
import { error, json } from '@sveltejs/kit';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db, communityComments, communityPosts, reportObservations, reports } from '$lib/server/db';
import { loadCommunityPost, requireCommunityUser, updateConfirmation } from '$lib/server/community';
import { removeMedia } from '$lib/server/community-media';
import type { RequestHandler } from './$types';
export const GET: RequestHandler = async ({ params, locals }) => json(await loadCommunityPost(params.id, locals.user?.id));
export const POST: RequestHandler = async (event) => {
	const user = requireCommunityUser(event);
	if (!z.uuid().safeParse(event.params.id).success) error(400, 'Invalid post.');
	const input = await event.request.json().catch(() => null);
	if (input?.action === 'like' && typeof input.liked === 'boolean') return json(await updateConfirmation(event.params.id, user.id, input.liked));
	if (input?.action === 'confirm' && typeof input.confirmed === 'boolean') return json(await updateConfirmation(event.params.id, user.id, input.confirmed));
	const parsed = z.object({ action: z.literal('comment'), body: z.string().trim().min(1).max(1000), parentId: z.uuid().nullable().optional() }).safeParse(input);
	if (!parsed.success) error(400, 'Write a comment between 1 and 1,000 characters.');
	const [post] = await db.select({ id: communityPosts.id, userId: communityPosts.userId, title: communityPosts.title }).from(communityPosts).where(and(eq(communityPosts.id, event.params.id), isNull(communityPosts.deletedAt)));
	if (!post) error(404, 'Post not found.');
	const comment = await db.transaction(async (tx) => {
		let parentUserId: string | undefined;
		if (parsed.data.parentId) {
			const [parent] = await tx.select({ id: communityComments.id, userId: communityComments.userId }).from(communityComments).where(and(eq(communityComments.id, parsed.data.parentId), eq(communityComments.postId, post.id)));
			if (!parent) error(400, 'The comment you are replying to is not on this post.');
			parentUserId = parent.userId;
		}
		const [comment] = await tx.insert(communityComments).values({ postId: post.id, userId: user.id, body: parsed.data.body, parentId: parsed.data.parentId || null }).returning();
		await notifyComment(tx, { ownerId: post.userId, parentUserId, actorId: user.id, postId: post.id, commentId: comment.id });
		await queuePostEmail(tx, { recipients: [post.userId, ...(parentUserId ? [parentUserId] : [])], actorId: user.id, actorName: user.name, postId: post.id, postTitle: post.title, eventKey: `comment:${comment.id}`, topic: 'comments', reply: !!parentUserId });
		return comment;
	});
	return json({ comment: { id: comment.id, parentId: comment.parentId, body: comment.body, createdAt: comment.createdAt.toISOString(), author: { id: user.id, name: user.name, avatarUrl: user.avatarUrl } } }, { status: 201 });
};

export const DELETE: RequestHandler = async (event) => {
	const user = requireCommunityUser(event);
	if (!z.uuid().safeParse(event.params.id).success) error(400, 'Invalid post.');
	const [post] = await db.select().from(communityPosts).where(and(eq(communityPosts.id, event.params.id), eq(communityPosts.userId, user.id), isNull(communityPosts.deletedAt)));
	if (!post) error(404, 'Post not found or you do not own it.');
	await db.transaction(async (tx) => {
		await tx.update(communityPosts).set({ deletedAt: new Date(), title: 'Post deleted by author', body: '', locationName: '', media: [], coverId: '' })
			.where(and(eq(communityPosts.id, post.id), eq(communityPosts.userId, user.id), isNull(communityPosts.deletedAt)));
		const [report] = await tx.select({ imagePath: reports.imagePath }).from(reports).where(eq(reports.id, post.reportId));
		if (post.media.some((media) => media.url === report?.imagePath)) {
			const activeSiblings = await tx.select({ id: communityPosts.id, media: communityPosts.media, coverId: communityPosts.coverId }).from(communityPosts)
				.where(and(eq(communityPosts.reportId, post.reportId), isNull(communityPosts.deletedAt)));
			const replacement = activeSiblings.filter((sibling) => sibling.id !== post.id).map((sibling) => sibling.media.find((media) => media.id === sibling.coverId) || sibling.media[0]).find(Boolean);
			await tx.update(reports).set({ imagePath: replacement?.url || '' }).where(eq(reports.id, post.reportId));
		}
		await tx.update(reportObservations).set({ media: [] }).where(eq(reportObservations.sourceId, post.draftId));
	});
	await removeMedia(post.media);
	return json({ deleted: true, retainedHazard: true });
};
