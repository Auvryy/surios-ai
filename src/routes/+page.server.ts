import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
export const load: PageServerLoad = ({ url }) => {
	const report = url.searchParams.get('report') || url.searchParams.get('incident') || url.searchParams.get('highlight') || url.searchParams.get('id');
	redirect(303, report ? `/map?report=${encodeURIComponent(report)}` : '/community');
};
