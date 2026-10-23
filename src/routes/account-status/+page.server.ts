import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
export const load: PageServerLoad = ({ locals }) => {
	if (!locals.user) redirect(303, '/login');
	if (locals.user.accountStatus === 'ACTIVE') redirect(303, '/community');
	return { status: locals.user.accountStatus };
};
