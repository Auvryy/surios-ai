import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { emptyPublicMapSnapshot } from '$lib/types/public-map';
import { loadPublicMapSnapshot } from '$lib/server/public-map';

export const load: PageServerLoad = async ({ url }) => {
	const report = url.searchParams.get('report') || url.searchParams.get('incident') || url.searchParams.get('highlight') || url.searchParams.get('id');
	if (report) redirect(303, '/map?report=' + encodeURIComponent(report));
	try {
		return { liveMap: await loadPublicMapSnapshot() };
	} catch (error) {
		console.error('Landing page map snapshot could not be loaded.', error);
		return { liveMap: emptyPublicMapSnapshot };
	}
};
