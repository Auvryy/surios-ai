import { loadCommunityPosts, communityFilters } from '$lib/server/community';
import type { PageServerLoad } from './$types';
export const load: PageServerLoad = async ({ locals, url }) => loadCommunityPosts(locals.user?.id, communityFilters(url));
