import { json } from '@sveltejs/kit';
import { loadProfile } from '$lib/server/profiles';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals, url }) => json(await loadProfile(params.id.toLowerCase(), locals.user?.id, url));
