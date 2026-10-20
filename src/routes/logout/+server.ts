import { redirect, type RequestHandler } from '@sveltejs/kit';
import { invalidateSession, deleteSessionTokenCookie } from '$lib/server/auth.js';

export const POST: RequestHandler = async (event) => {
	if (event.locals.session) {
		await invalidateSession(event.locals.session.id);
	}

	deleteSessionTokenCookie(event);
	throw redirect(303, '/');
};

export const GET: RequestHandler = async (event) => {
	if (event.locals.session) {
		await invalidateSession(event.locals.session.id);
	}

	deleteSessionTokenCookie(event);
	throw redirect(303, '/');
};
