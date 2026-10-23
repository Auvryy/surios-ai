import { loadCommunityPosts } from '$lib/server/community';
import type { PageServerLoad } from './$types';
export const load: PageServerLoad = async ({ locals }) => ({ posts: await loadCommunityPosts(locals.user?.id) });
