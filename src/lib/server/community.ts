import { queuePostEmail } from './email';
import { z } from 'zod';
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { communitySearch, communitySorts, normalizeSearch, type CommunitySort } from './community-search';
import { error, type RequestEvent } from '@sveltejs/kit';
import { db, communityPosts, communityComments, communityConfirmations, users, reports, reportObservations } from './db';
import { alias } from 'drizzle-orm/pg-core';
import { communityCommentLikes, communityReposts } from './db/community-social-schema';
import { lockReports, refreshReportSupport } from './hazard-reporting';
import type { CommunityPost, CommunityRepost, CommunityFeedItem } from '$lib/types/community';

export function requireCommunityUser(event: RequestEvent) {
	if (!event.locals.user) error(401, 'Sign in to post or join the discussion.');
	if (event.request.headers.get('origin') !== event.url.origin) error(403, 'Invalid request origin.');
	return event.locals.user;
}

export interface CommunityFilters { q: string; tab: string; media: string; author: string; currentPage: number; originalsOnly?: boolean; sort?: CommunitySort }
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
type CommunityRow = {
	post: typeof communityPosts.$inferSelect;
	grouping: CommunityPost['grouping'];
	author: CommunityPost['author'];
};
const authorFields = { id: users.id, name: users.name, avatarUrl: users.avatarUrl, role: users.role };

async function hydratePosts(rows: CommunityRow[], userId?: string) {
	const uniqueRows = [...new Map(rows.map((row) => [row.post.id, row])).values()];
	if (!uniqueRows.length) return [] as CommunityPost[];
	const ids = uniqueRows.map(({ post }) => post.id);
	const [officialUpdates, statuses, confirmations, comments, reposts] = await Promise.all([
		db.select({ reportId: communityPosts.reportId, id: communityReposts.id, postId: communityReposts.postId }).from(communityReposts)
			.innerJoin(communityPosts, eq(communityPosts.id, communityReposts.postId))
			.where(and(inArray(communityPosts.reportId, uniqueRows.map(({ post }) => post.reportId)), sql`${communityReposts.governmentUpdate} is not null`))
			.orderBy(desc(communityReposts.createdAt), desc(communityReposts.id)),
		db.select({ id: reports.id, status: reports.status }).from(reports).where(inArray(reports.id, uniqueRows.map(({ post }) => post.reportId))),
		db.select().from(communityConfirmations).where(inArray(communityConfirmations.postId, ids)),
		db.select({ comment: communityComments, author: { id: users.id, name: users.name, avatarUrl: users.avatarUrl },
			likes: sql<number>`(select count(*)::int from ${communityCommentLikes} where ${communityCommentLikes.commentId} = ${communityComments.id})`,
			userLiked: userId ? sql<boolean>`exists (select 1 from ${communityCommentLikes} where ${communityCommentLikes.commentId} = ${communityComments.id} and ${communityCommentLikes.userId} = ${userId})` : sql<boolean>`false`,
			replies: sql<number>`(select count(*)::int from community_comments replies where replies.parent_id = ${communityComments.id})`
		}).from(communityComments).innerJoin(users, eq(users.id, communityComments.userId)).where(inArray(communityComments.postId, ids)),
		db.select({ postId: communityReposts.postId, userId: communityReposts.userId }).from(communityReposts).where(inArray(communityReposts.postId, ids))
	]);
	const awaitedStatuses = new Map(statuses.map((report) => [report.id, report.status]));
	return uniqueRows.map(({ post, author, grouping }): CommunityPost => ({
		grouping, id: post.id, title: post.title, body: post.body, locationName: post.locationName,
		latitude: Number(post.latitude), longitude: Number(post.longitude), media: post.media, coverId: post.coverId,
		analysis: post.analysis, reportId: post.reportId, reportStatus: (awaitedStatuses.get(post.reportId) || 'REPORTED'), governmentUpdateLink: (() => { const update = officialUpdates.find((update) => update.reportId === post.reportId); return update ? `/community/post/${update.postId}?repost=${update.id}#repost-${update.id}` : null; })(), createdAt: post.createdAt.toISOString(), author,
		confirmations: confirmations.filter((item) => item.postId === post.id).length,
		userConfirmed: confirmations.some((item) => item.postId === post.id && item.userId === userId),
		reposts: reposts.filter((item) => item.postId === post.id).length,
		userReposted: reposts.some((item) => item.postId === post.id && item.userId === userId),
		comments: comments.filter(({ comment }) => comment.postId === post.id)
			.map(({ comment, author, likes, userLiked, replies }) => ({ id: comment.id, parentId: comment.parentId, body: comment.body, createdAt: comment.createdAt.toISOString(), author, likes, userLiked, replies }))
			.sort((a, b) => b.likes - a.likes || b.replies - a.replies || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))
	}));
}

export async function loadCommunityPost(id: string, userId?: string) {
	if (!z.uuid().safeParse(id).success) error(404, 'Post not found.');
	const rows = await db.select({ post: communityPosts, grouping: reportObservations.match, author: authorFields }).from(communityPosts)
		.innerJoin(users, eq(users.id, communityPosts.userId)).leftJoin(reportObservations, eq(reportObservations.sourceId, communityPosts.draftId)).where(eq(communityPosts.id, id));
	const [post] = await hydratePosts(rows, userId);
	if (!post) error(404, 'Post not found.');
	const siblings = await db.select({ id: communityPosts.id }).from(communityPosts).where(eq(communityPosts.reportId, post.reportId));
	const reposts = await db.select({ repost: communityReposts, author: authorFields }).from(communityReposts).innerJoin(users, eq(users.id, communityReposts.userId)).where(sql`(${communityReposts.postId} = ${id} or (${inArray(communityReposts.postId, siblings.map((sibling) => sibling.id))} and ${communityReposts.governmentUpdate} is not null))`).orderBy(desc(communityReposts.createdAt), desc(communityReposts.id));
	const originalRows = await db.select({ post: communityPosts, grouping: reportObservations.match, author: authorFields }).from(communityPosts).innerJoin(users, eq(users.id, communityPosts.userId)).leftJoin(reportObservations, eq(reportObservations.sourceId, communityPosts.draftId)).where(inArray(communityPosts.id, siblings.map((sibling) => sibling.id)));
	const originals = await hydratePosts(originalRows, userId);
	return { post, reposts: reposts.map(({ repost, author }): CommunityRepost => ({ ...repost, createdAt: repost.createdAt.toISOString(), author, post: originals.find((original) => original.id === repost.postId)! })) };
}

export async function loadCommunityPosts(userId?: string, filters: CommunityFilters = { q: '', tab: '', media: '', author: '', currentPage: 1 }) {
	const common = [];
	if (filters.tab === 'critical') common.push(sql`(${communityPosts.analysis}->>'hazardSeverity')::int >= 8`);
	if (filters.tab === 'confirmed') common.push(userId ? sql`exists (select 1 from ${communityConfirmations} where ${communityConfirmations.postId} = ${communityPosts.id} and ${communityConfirmations.userId} = ${userId})` : sql`false`);
	const search = filters.q ? communitySearch(filters.q) : null;
	const reposter = alias(users, 'reposter');
	const repostSearch = filters.q ? communitySearch(filters.q, sql`concat_ws(' ', ${communityReposts.body}, ${reposter.name})`) : null;
	const mediaMatch = sql`exists (select 1 from jsonb_array_elements(${communityPosts.media}) as attachment where attachment->>'kind' = ${filters.media})`;
	const where = and(...common, ...(search ? [search.where] : []), ...(filters.author ? [eq(communityPosts.userId, filters.author)] : []), ...(filters.media ? [mediaMatch] : []));
	const repostWhere = and(...common, ...(filters.originalsOnly ? [sql`false`] : []), ...(repostSearch ? [repostSearch.where] : []), ...(filters.author ? [eq(communityReposts.userId, filters.author)] : []), ...(filters.media ? [sql`(${mediaMatch} or exists (select 1 from jsonb_array_elements(${communityReposts.media}) as attachment where attachment->>'kind' = ${filters.media}) or exists (select 1 from jsonb_array_elements(coalesce(${communityReposts.governmentUpdate}->'attachments', '[]'::jsonb)) as attachment where attachment->>'kind' = ${filters.media}))`] : []));
	const limit = filters.currentPage * 20;
	const sort = filters.sort || (search ? 'relevance' : 'newest');
	const confirmationCount = sql<number>`(select count(*) from ${communityConfirmations} where ${communityConfirmations.postId} = ${communityPosts.id})`;
	function ordering(repost = false) {
		const date = repost ? communityReposts.createdAt : communityPosts.createdAt;
		const id = repost ? communityReposts.id : communityPosts.id;
		if (sort === 'oldest') return [asc(date), asc(id)];
		const rank = repost ? repostSearch?.rank : search?.rank;
		return [...(sort === 'relevance' && rank ? [desc(rank)] : sort === 'severity' ? [desc(sql`(${communityPosts.analysis}->>'hazardSeverity')::int`)] : sort === 'confirmations' ? [desc(confirmationCount)] : []), desc(date), desc(id)];
	}
	const [rows, repostRows, [count], [repostCount]] = await Promise.all([
		db.select({ post: communityPosts, grouping: reportObservations.match, author: authorFields, rank: search?.rank || sql<number>`0` }).from(communityPosts)
			.innerJoin(users, eq(users.id, communityPosts.userId)).leftJoin(reportObservations, eq(reportObservations.sourceId, communityPosts.draftId)).where(where).orderBy(...ordering()).limit(limit),
		db.select({ repost: communityReposts, post: communityPosts, author: authorFields, reposter: { id: reposter.id, name: reposter.name, avatarUrl: reposter.avatarUrl, role: reposter.role }, rank: repostSearch?.rank || sql<number>`0` }).from(communityReposts)
			.innerJoin(communityPosts, eq(communityPosts.id, communityReposts.postId)).innerJoin(users, eq(users.id, communityPosts.userId)).innerJoin(reposter, eq(reposter.id, communityReposts.userId)).where(repostWhere).orderBy(...ordering(true)).limit(limit),
		db.select({ total: sql<number>`count(*)::int` }).from(communityPosts).innerJoin(users, eq(users.id, communityPosts.userId)).where(where),
		db.select({ total: sql<number>`count(*)::int` }).from(communityReposts).innerJoin(communityPosts, eq(communityPosts.id, communityReposts.postId)).innerJoin(users, eq(users.id, communityPosts.userId)).innerJoin(reposter, eq(reposter.id, communityReposts.userId)).where(repostWhere)
	]);
	const hydrated = await hydratePosts([...repostRows.map((row) => ({ post: row.post, author: row.author, grouping: null })), ...rows], userId);
	const byId = new Map(hydrated.map((post) => [post.id, post]));
	const posts = rows.map((row) => byId.get(row.post.id)!);
	const reposts = repostRows.map((row): CommunityRepost => ({ ...row.repost, author: row.reposter, createdAt: row.repost.createdAt.toISOString(), post: byId.get(row.post.id)! }));
	const ranked = [
		...posts.map((post, index) => ({ item: { kind: 'post', id: post.id, post } as CommunityFeedItem, post, date: post.createdAt, rank: Number(rows[index].rank) })),
		...reposts.map((repost, index) => ({ item: { kind: 'repost', id: repost.id, repost } as CommunityFeedItem, post: repost.post, date: repost.createdAt, rank: Number(repostRows[index].rank) }))
	];
	ranked.sort((a, b) => {
		if (sort === 'relevance' && search && a.rank !== b.rank) return b.rank - a.rank;
		if (sort === 'severity' && a.post.analysis.hazardSeverity !== b.post.analysis.hazardSeverity) return b.post.analysis.hazardSeverity - a.post.analysis.hazardSeverity;
		if (sort === 'confirmations' && a.post.confirmations !== b.post.confirmations) return b.post.confirmations - a.post.confirmations;
		const date = a.date.localeCompare(b.date), id = a.item.id.localeCompare(b.item.id);
		return sort === 'oldest' ? date || id : -date || -id;
	});
	const total = count.total + repostCount.total;
	return { posts, reposts, feed: ranked.slice(0, limit).map(({ item }) => item), total, hasMore: total > limit && filters.currentPage < 50, currentPage: filters.currentPage, filters };
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
