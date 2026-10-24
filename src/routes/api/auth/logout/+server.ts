import { error, json } from '@sveltejs/kit';
import { invalidateSession, deleteSessionTokenCookie } from '$lib/server/auth';
import { requireMutationOrigin } from '$lib/server/api-access';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	if (!event.locals.session) error(401, 'Sign in to continue.');
	requireMutationOrigin(event);
	await invalidateSession(event.locals.session.id);
	if (event.locals.authMethod === 'cookie') deleteSessionTokenCookie(event);
	return json({ success: true });
};
