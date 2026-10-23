import { queuePostEmail } from './email';
import { z } from 'zod';
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { communitySearch, communitySorts, normalizeSearch, type CommunitySort } from './community-search';
import { error, type RequestEvent } from '@sveltejs/kit';
import { db, communityPosts, communityComments, communityConfirmations, users, reports, reportObservations } from './db';
import { lockReports, refreshReportSupport } from './hazard-reporting';
import type { CommunityPost } from '$lib/types/community';

export function requireCommunityUser(event: RequestEvent) {
	if (!event.locals.user) error(401, 'Sign in to post or join the discussion.');
	if (event.request.headers.get('origin') !== event.url.origin) error(403, 'Invalid request origin.');
	return event.locals.user;
}

export interface CommunityFilters { q: string; tab: string; media: string; author: string; currentPage: number; sort?: CommunitySort }
export function communityFilters(url: URL): CommunityFilters {
	const params = url.searchParams;
	const q = normalizeSearch(params.get('q') || '');
	const requestedSort = communitySorts.find((sort) => sort === params.get('sort'));
	return {
		q,
		sort: requestedSort === 'relevance' && !q ? 'newest' : requestedSort || (q ? 'relevance' : 'newest'),
		tab: ['critical', 'confirmed'].includes(params.get('tab') || '') ? params.get('tab')! : '',
		media: ['photo', 'video'].includes(params.get('media') || '') ? params.get('media')! : '',
		author: z.uuid().safeParse(params.get('author')).success ? params.get('author')! : '',
		currentPage: Math.min(50, Math.max(1, Math.floor(Number(params.get('page')) || 1)))
	};
}
export async function loadCommunityPosts(userId?: string, filters: CommunityFilters = { q: '', tab: '', media: '', author: '', currentPage: 1 }) {
	const clauses = [];
	const search = filters.q ? communitySearch(filters.q) : null;
	if (filters.author) clauses.push(eq(communityPosts.userId, filters.author));
	if (search) clauses.push(search.where);
	if (filters.media) clauses.push(sql`exists (select 1 from jsonb_array_elements(${communityPosts.media}) as attachment where attachment->>'kind' = ${filters.media})`);
	if (filters.tab === 'critical') clauses.push(sql`(${communityPosts.analysis}->>'hazardSeverity')::int >= 8`);
	if (filters.tab === 'confirmed') clauses.push(userId ? sql`exists (select 1 from ${communityConfirmations} where ${communityConfirmations.postId} = ${communityPosts.id} and ${communityConfirmations.userId} = ${userId})` : sql`false`);
	const where = and(...clauses);
	const limit = filters.currentPage * 20;
	const sort = filters.sort || (search ? 'relevance' : 'newest');
	const confirmationCount = sql<number>`(select count(*) from ${communityConfirmations} where ${communityConfirmations.postId} = ${communityPosts.id})`;
	const order = sort === 'oldest' ? [asc(communityPosts.createdAt), asc(communityPosts.id)]
		: [...(sort === 'relevance' && search ? [desc(search.rank)]
			: sort === 'severity' ? [desc(sql`(${communityPosts.analysis}->>'hazardSeverity')::int`)]
			: sort === 'confirmations' ? [desc(confirmationCount)] : []), desc(communityPosts.createdAt), desc(communityPosts.id)];
	const [rows, [count]] = await Promise.all([
		db.select({ post: communityPosts, grouping: reportObservations.match, author: { id: users.id, name: users.name, avatarUrl: users.avatarUrl, role: users.role } }).from(communityPosts)
			.innerJoin(users, eq(users.id, communityPosts.userId)).leftJoin(reportObservations, eq(reportObservations.sourceId, communityPosts.draftId)).where(where).orderBy(...order).limit(limit),
		db.select({ total: sql<number>`count(*)::int` }).from(communityPosts).innerJoin(users, eq(users.id, communityPosts.userId)).where(where)
	]);
	const result = { posts: [] as CommunityPost[], total: count.total, hasMore: count.total > limit && filters.currentPage < 50, currentPage: filters.currentPage, filters };
	if (!rows.length) return result;
	const ids = rows.map(({ post }) => post.id);
	const [confirmations, comments] = await Promise.all([
		db.select().from(communityConfirmations).where(inArray(communityConfirmations.postId, ids)),
		db.select({ comment: communityComments, author: { id: users.id, name: users.name, avatarUrl: users.avatarUrl } }).from(communityComments)
			.innerJoin(users, eq(users.id, communityComments.userId)).where(inArray(communityComments.postId, ids)).orderBy(communityComments.createdAt)
	]);
	result.posts = rows.map(({ post, author, grouping }) => ({
		grouping,
		id: post.id, title: post.title, body: post.body, locationName: post.locationName,
		latitude: Number(post.latitude), longitude: Number(post.longitude), media: post.media, coverId: post.coverId,
		analysis: post.analysis, reportId: post.reportId, createdAt: post.createdAt.toISOString(), author,
		confirmations: confirmations.filter((confirmation) => confirmation.postId === post.id).length,
		userConfirmed: confirmations.some((confirmation) => confirmation.postId === post.id && confirmation.userId === userId),
		comments: comments.filter(({ comment }) => comment.postId === post.id).map(({ comment, author }) => ({ id: comment.id, parentId: comment.parentId, body: comment.body, createdAt: comment.createdAt.toISOString(), author }))
	}));
	return result;
}

export async function updateConfirmation(postId: string, userId: string, confirmed: boolean) {
	return db.transaction(async (tx) => {
		await lockReports(tx);
		const [post] = await tx.select().from(communityPosts).where(eq(communityPosts.id, postId)).for('update');
		if (!post) error(404, 'Post not found.');
		if (confirmed) {
			const [added] = await tx.insert(communityConfirmations).values({ postId, userId }).onConflictDoNothing().returning();
			if (added) {
				const [actor] = await tx.select({ name: users.name }).from(users).where(eq(users.id, userId));
				await queuePostEmail(tx, { recipients: [post.userId], actorId: userId, actorName: actor.name, postId, postTitle: post.title, eventKey: `confirmation:${postId}:${userId}`, topic: 'confirmations' });
			}
		} else await tx.delete(communityConfirmations).where(and(eq(communityConfirmations.postId, postId), eq(communityConfirmations.userId, userId)));
		const [result] = await tx.select({ count: sql<number>`count(*)::int` }).from(communityConfirmations).where(eq(communityConfirmations.postId, postId));
		await refreshReportSupport(tx, post.reportId);
		return { confirmations: result.count, userConfirmed: confirmed };
	});
}
