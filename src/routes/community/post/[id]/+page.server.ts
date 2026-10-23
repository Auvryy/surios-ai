import { loadCommunityPost } from '$lib/server/community';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, url }) => ({
	...await loadCommunityPost(params.id, locals.user?.id),
	mediaId: url.searchParams.get('media') || ''
});
