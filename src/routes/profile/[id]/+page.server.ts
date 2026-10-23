import type { PageServerLoad } from './$types';
import { loadProfile } from '$lib/server/profiles';
export const load: PageServerLoad = ({ params, locals, url }) => loadProfile(params.id, locals.user?.id, url);
