import type { PageServerLoad } from './$types';
import { requireGovernmentUser } from '$lib/server/work-orders';
import { communityFilters, loadCommunityPosts } from '$lib/server/community';

export const load: PageServerLoad = async (event) => {
	requireGovernmentUser(event);
	const filters = { ...communityFilters(event.url), originalsOnly: true };
	const feed = await loadCommunityPosts(event.locals.user!.id, filters);
	return { ...feed, posts: [...new Map(feed.posts.map((post) => [post.reportId, post])).values()] };
};
