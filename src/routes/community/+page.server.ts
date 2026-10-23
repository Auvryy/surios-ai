import { loadCommunityPosts, communityFilters } from '$lib/server/community';
import { loadProfile } from '$lib/server/profiles';
import type { PageServerLoad } from './$types';
export const load: PageServerLoad = async ({ locals, url }) => {
	const id = url.searchParams.get('profile');
	if (id) {
		const feed = await loadProfile(id, locals.user?.id, url);
		return { ...feed, viewedProfile: feed.profile, isOwner: false };
	}
	return { ...await loadCommunityPosts(locals.user?.id, communityFilters(url)), viewedProfile: null, isOwner: false };
};
