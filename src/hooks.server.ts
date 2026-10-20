import { redirect } from '@sveltejs/kit';
import type { Handle, ServerInit } from '@sveltejs/kit/hooks';
import {
	validateSessionToken,
	setSessionTokenCookie,
	deleteSessionTokenCookie,
	ensureInitialSeedUsers
} from '$lib/server/auth.js';

export const init: ServerInit = async () => {
	await ensureInitialSeedUsers();
};

export const handle: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get('surios_session');

	if (!sessionToken) {
		event.locals.user = null;
		event.locals.session = null;
	} else {
		const { session, user } = await validateSessionToken(sessionToken);

		if (session !== null) {
			setSessionTokenCookie(event, sessionToken, session.expiresAt);
			event.locals.user = user;
			event.locals.session = session;
		} else {
			deleteSessionTokenCookie(event);
			event.locals.user = null;
			event.locals.session = null;
		}
	}

	const pathname = event.url.pathname;

	// Route Guard: Protect /dashboard from unauthenticated visitors
	if (pathname.startsWith('/dashboard')) {
		if (!event.locals.user) {
			const redirectTo = encodeURIComponent(pathname + event.url.search);
			throw redirect(303, `/login?redirectTo=${redirectTo}`);
		}
	}

	// Route Guard: Redirect already authenticated users away from /login and /register
	if ((pathname === '/login' || pathname === '/register') && event.locals.user) {
		const redirectTo = event.url.searchParams.get('redirectTo') || '/dashboard';
		throw redirect(303, redirectTo);
	}

	return resolve(event);
};
