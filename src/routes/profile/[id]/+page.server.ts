import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
export const load: PageServerLoad = ({ params, url }) => {
	const destination = new URL('/community', url);
	destination.searchParams.set('profile', params.id);
	if (url.searchParams.has('page')) destination.searchParams.set('page', url.searchParams.get('page')!);
	redirect(303, destination.pathname + destination.search);
};
