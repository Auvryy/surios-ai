import { error, json } from '@sveltejs/kit';
import { accountJson } from '$lib/server/accounts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user || !locals.session) error(401, 'Sign in to continue.');
	return json({ user: accountJson(locals.user), expiresAt: locals.session.expiresAt.toISOString() });
};
