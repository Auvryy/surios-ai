import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { error, type RequestEvent } from '@sveltejs/kit';
import { db, communityPosts, communityComments, communityConfirmations, users } from './db';
import type { CommunityPost } from '$lib/types/community';

export function requireCommunityUser(event: RequestEvent) {
	if (!event.locals.user) error(401, 'Sign in to post or join the discussion.');
	if (event.request.headers.get('origin') !== event.url.origin) error(403, 'Invalid request origin.');
	return event.locals.user;
}

export async function loadCommunityPosts(userId?: string): Promise<CommunityPost[]> {
	const rows = await db.select({ post: communityPosts, author: { id: users.id, name: users.name, role: users.role } })
		.from(communityPosts).innerJoin(users, eq(users.id, communityPosts.userId))
		.orderBy(desc(communityPosts.createdAt)).limit(200);
	if (!rows.length) return [];
	const ids = rows.map(({ post }) => post.id);
	const [confirmations, comments] = await Promise.all([
		db.select().from(communityConfirmations).where(inArray(communityConfirmations.postId, ids)),
		db.select({ comment: communityComments, author: { id: users.id, name: users.name } }).from(communityComments)
			.innerJoin(users, eq(users.id, communityComments.userId)).where(inArray(communityComments.postId, ids)).orderBy(communityComments.createdAt)
	]);
	return rows.map(({ post, author }) => ({
		id: post.id, title: post.title, body: post.body, locationName: post.locationName,
		latitude: Number(post.latitude), longitude: Number(post.longitude), media: post.media, coverId: post.coverId,
		analysis: post.analysis, reportId: post.reportId, createdAt: post.createdAt.toISOString(), author,
		confirmations: confirmations.filter((confirmation) => confirmation.postId === post.id).length,
		userConfirmed: confirmations.some((confirmation) => confirmation.postId === post.id && confirmation.userId === userId),
		comments: comments.filter(({ comment }) => comment.postId === post.id).map(({ comment, author }) => ({ id: comment.id, body: comment.body, createdAt: comment.createdAt.toISOString(), author }))
	}));
}

export async function updateConfirmation(postId: string, userId: string, confirmed: boolean) {
	return db.transaction(async (tx) => {
		const [post] = await tx.select().from(communityPosts).where(eq(communityPosts.id, postId)).for('update');
		if (!post) error(404, 'Post not found.');
		if (confirmed) await tx.insert(communityConfirmations).values({ postId, userId }).onConflictDoNothing();
		else await tx.delete(communityConfirmations).where(and(eq(communityConfirmations.postId, postId), eq(communityConfirmations.userId, userId)));
		const [result] = await tx.select({ count: sql<number>`count(*)::int` }).from(communityConfirmations).where(eq(communityConfirmations.postId, postId));
		// A submitted report counts as one observation; community confirmations add to it.
		const { reports } = await import('./db');
		await tx.update(reports).set({ communityConfirmations: result.count + 1, updatedAt: new Date() }).where(eq(reports.id, post.reportId));
		return { confirmations: result.count, userConfirmed: confirmed };
	});
}
