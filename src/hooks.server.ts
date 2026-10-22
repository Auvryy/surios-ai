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
	const role = event.locals.user?.role;
	const isGovUser = role === 'ENGINEER' || role === 'OFFICER' || role === 'ADMIN';

	// Redirect removed overscoped routes (/docs, /crews) to the user's primary workspace
	if (pathname.startsWith('/docs') || pathname.startsWith('/crews')) {
		throw redirect(303, isGovUser ? '/dashboard' : '/community');
	}

	// Route Guard: Government-only routes (/dashboard, /verification, /analytics)
	if (
		pathname.startsWith('/dashboard') ||
		pathname.startsWith('/verification') ||
		pathname.startsWith('/analytics')
	) {
		if (!event.locals.user) {
			const redirectTo = encodeURIComponent(pathname + event.url.search);
			throw redirect(303, `/login?redirectTo=${redirectTo}`);
		}
		if (!isGovUser) {
			throw redirect(303, '/community');
		}
	}

	// Route Guard: Community-only routes (/community, /liked, /report) redirect Gov users to /dashboard
	if (pathname.startsWith('/community') || pathname.startsWith('/liked')) {
		if (isGovUser) {
			throw redirect(303, '/dashboard');
		}
	}

	// Route Guard: Redirect already authenticated users away from /login and /register
	if ((pathname === '/login' || pathname === '/register') && event.locals.user) {
		const defaultHome = isGovUser ? '/dashboard' : '/community';
		const requested = event.url.searchParams.get('redirectTo');
		const redirectTo =
			requested && !(!isGovUser && pathname.startsWith('/dashboard')) ? requested : defaultHome;
		throw redirect(303, redirectTo);
	}

	return resolve(event);
};
