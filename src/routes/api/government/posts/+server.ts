import { json } from '@sveltejs/kit';
import { requireGovernmentUser } from '$lib/server/work-orders';
import { communityFilters, loadCommunityPosts } from '$lib/server/community';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	const user = requireGovernmentUser(event);
	const feed = await loadCommunityPosts(user.id, { ...communityFilters(event.url), originalsOnly: true });
	return json({ ...feed, posts: [...new Map(feed.posts.map((post) => [post.reportId, post])).values()] });
};
