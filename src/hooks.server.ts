import { startEmailWorker } from '$lib/server/email';
import { dev } from '$app/env';
import { redirect } from '@sveltejs/kit';
import { isGovernmentUser, isRetiredPage, workspaceRedirect } from '$lib/server/workspace';
import type { Handle, ServerInit } from '@sveltejs/kit/hooks';
import {
	validateSessionToken,
	setSessionTokenCookie,
	deleteSessionTokenCookie,
	ensureInitialSeedUsers
} from '$lib/server/auth.js';

export const init: ServerInit = async () => {
	if (dev) await ensureInitialSeedUsers();
	startEmailWorker();
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
	const isGovUser = isGovernmentUser(role);

	// Consolidated government tools now live in the single work order workspace.
	if (isRetiredPage(pathname)) {
		throw redirect(303, isGovUser ? '/dashboard' : '/community');
	}

	// Guard the workspace and its export endpoint, matching path boundaries.
	if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
		if (!event.locals.user) {
			const redirectTo = encodeURIComponent(pathname + event.url.search);
			throw redirect(303, `/login?redirectTo=${redirectTo}`);
		}
		if (!isGovUser) {
			throw redirect(303, '/community');
		}
	}

	// Route Guard: Redirect already authenticated users away from /login and /register
	if ((pathname === '/login' || pathname === '/register') && event.locals.user) {
		throw redirect(303, workspaceRedirect(event.url.searchParams.get('redirectTo'), role));
	}

	return resolve(event);
};
