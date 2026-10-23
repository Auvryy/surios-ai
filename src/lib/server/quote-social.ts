import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import { z } from 'zod';
import { db, users } from './db';
import { communityReposts, quoteLikes, quoteComments, quoteCommentLikes } from './db/community-social-schema';
import type { CommunityRepost, CommunityComment } from '$lib/types/community';

export async function hydrateQuotes(quotes: CommunityRepost[], viewerId?: string) {
	if (!quotes.length) return quotes;
	const ids = quotes.map((quote) => quote.id);
	const [likes, comments, shares, parents] = await Promise.all([
		db.select().from(quoteLikes).where(inArray(quoteLikes.repostId, ids)),
		db.select({ comment: quoteComments, author: { id: users.id, name: users.name, avatarUrl: users.avatarUrl },
			likes: sql<number>`(select count(*)::int from ${quoteCommentLikes} where ${quoteCommentLikes.commentId} = ${quoteComments.id})`,
			userLiked: viewerId ? sql<boolean>`exists (select 1 from ${quoteCommentLikes} where ${quoteCommentLikes.commentId} = ${quoteComments.id} and ${quoteCommentLikes.userId} = ${viewerId})` : sql<boolean>`false`,
			replies: sql<number>`(select count(*)::int from community_quote_comments replies where replies.parent_id = ${quoteComments.id})`
		}).from(quoteComments).innerJoin(users, eq(users.id, quoteComments.userId)).where(inArray(quoteComments.repostId, ids)).orderBy(asc(quoteComments.createdAt), asc(quoteComments.id)),
		db.select({ id: communityReposts.id, parent: communityReposts.quotedRepostId }).from(communityReposts).where(inArray(communityReposts.quotedRepostId, ids)),
		db.select({ quote: communityReposts, author: { id: users.id, name: users.name, avatarUrl: users.avatarUrl, role: users.role } }).from(communityReposts).innerJoin(users, eq(users.id, communityReposts.userId)).where(inArray(communityReposts.id, quotes.flatMap((quote) => quote.quotedRepostId ? [quote.quotedRepostId] : [])))
	]);
	return quotes.map((quote) => {
		const parent = parents.find((parent) => parent.quote.id === quote.quotedRepostId);
		return { ...quote, likes: likes.filter((like) => like.repostId === quote.id).length,
			userLiked: likes.some((like) => like.repostId === quote.id && like.userId === viewerId),
			reposts: shares.filter((share) => share.parent === quote.id).length,
			comments: comments.filter(({ comment }) => comment.repostId === quote.id).map(({ comment, ...meta }): CommunityComment => ({ ...meta, id: comment.id, parentId: comment.parentId, body: comment.body, createdAt: comment.createdAt.toISOString() })),
			quotedRepost: parent ? { ...parent.quote, createdAt: parent.quote.createdAt.toISOString(), author: parent.author, post: quote.post, likes: 0, userLiked: false, reposts: 0, comments: [] } : null
		};
	});
}

export async function interactWithQuote(id: string, userId: string, input: unknown) {
	if (!z.uuid().safeParse(id).success) error(400, 'Invalid post.');
	const [quote] = await db.select({ id: communityReposts.id }).from(communityReposts).where(eq(communityReposts.id, id));
	if (!quote) error(404, 'Post not found.');
	const reaction = z.object({ action: z.literal('like'), liked: z.boolean() }).safeParse(input);
	if (reaction.success) {
		if (reaction.data.liked) await db.insert(quoteLikes).values({ repostId: id, userId }).onConflictDoNothing();
		else await db.delete(quoteLikes).where(and(eq(quoteLikes.repostId, id), eq(quoteLikes.userId, userId)));
		const [result] = await db.select({ likes: sql<number>`count(*)::int` }).from(quoteLikes).where(eq(quoteLikes.repostId, id));
		return { likes: result.likes, userLiked: reaction.data.liked };
	}
	const parsed = z.object({ action: z.literal('comment'), body: z.string().trim().min(1).max(1000), parentId: z.uuid().nullable().optional() }).safeParse(input);
	if (!parsed.success) error(400, 'Write a comment between 1 and 1,000 characters.');
	if (parsed.data.parentId) {
		const [parent] = await db.select().from(quoteComments).where(and(eq(quoteComments.id, parsed.data.parentId), eq(quoteComments.repostId, id)));
		if (!parent) error(400, 'The reply must belong to this post.');
	}
	const [comment] = await db.insert(quoteComments).values({ repostId: id, userId, body: parsed.data.body, parentId: parsed.data.parentId || null }).returning();
	return { id: comment.id };
}

export async function likeQuoteComment(repostId: string, commentId: string, userId: string, liked: boolean) {
	const [comment] = await db.select().from(quoteComments).where(and(eq(quoteComments.id, commentId), eq(quoteComments.repostId, repostId)));
	if (!comment) error(404, 'Comment not found on this post.');
	if (liked) await db.insert(quoteCommentLikes).values({ commentId, userId }).onConflictDoNothing();
	else await db.delete(quoteCommentLikes).where(and(eq(quoteCommentLikes.commentId, commentId), eq(quoteCommentLikes.userId, userId)));
	return { userLiked: liked };
}
