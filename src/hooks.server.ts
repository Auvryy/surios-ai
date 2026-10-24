import { startEmailWorker } from '$lib/server/email';
import { dev } from '$app/env';
import { error, json, redirect } from '@sveltejs/kit';
import { isAllowedApiOrigin, restoreNativeContentType } from '$lib/server/api-access';
import { isGovernmentUser, isRetiredPage, workspaceRedirect } from '$lib/server/workspace';
import type { Handle, ServerInit } from '@sveltejs/kit/hooks';
import {
	validateSessionToken,
	setSessionTokenCookie,
	deleteSessionTokenCookie,
	ensureInitialSeedUsers,
	mobileSessionId
} from '$lib/server/auth.js';

export const init: ServerInit = async () => {
	if (dev) await ensureInitialSeedUsers();
	startEmailWorker();
};

export const handle: Handle = async ({ event, resolve }) => {
	const pathname = event.url.pathname;
	const api = pathname === '/api' || pathname.startsWith('/api/');
	const origin = event.request.headers.get('origin');
	const finish = (response: Response) => {
		if (!api) return response;
		const headers = new Headers(response.headers);
		headers.set('Cache-Control', 'private, no-store');
		headers.set('X-Content-Type-Options', 'nosniff');
		headers.set('Vary', [...new Set([...(headers.get('Vary') || '').split(',').map((value) => value.trim()).filter(Boolean), 'Origin', 'Authorization', 'Cookie'])].join(', '));
		if (origin && isAllowedApiOrigin(origin, event.url.origin)) {
			headers.set('Access-Control-Allow-Origin', origin);
			headers.set('Access-Control-Expose-Headers', 'Content-Disposition, WWW-Authenticate');
		}
		return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
	};
	if (api && origin && !isAllowedApiOrigin(origin, event.url.origin)) return finish(json({ message: 'Invalid request origin.' }, { status: 403 }));
	if (api && event.request.method === 'OPTIONS') {
		const requestedMethod = event.request.headers.get('access-control-request-method') || '';
		const requestedHeaders = (event.request.headers.get('access-control-request-headers') || '').toLowerCase().split(',').map((value) => value.trim()).filter(Boolean);
		if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(requestedMethod) || requestedHeaders.some((header) => !['authorization', 'content-type', 'x-assessment-id'].includes(header))) return finish(json({ message: 'Unsupported preflight request.' }, { status: 403 }));
		return finish(new Response(null, { status: 204, headers: { 'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE', 'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Assessment-Id', 'Access-Control-Max-Age': '600' } }));
	}
	const authorization = api ? event.request.headers.get('authorization') : null;
	const bearer = authorization?.match(/^Bearer (surios_mobile_[a-f0-9]{64})$/i)?.[1];
	const cookie = event.cookies.get('surios_session');
	const sessionToken = authorization ? bearer ? mobileSessionId(bearer) : null : cookie && !cookie.startsWith('mobile:') ? cookie : null;
	event.locals.authMethod = null;
	if (authorization && !sessionToken) return finish(json({ message: 'Invalid mobile session. Sign in again.' }, { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } }));

	if (!sessionToken) {
		event.locals.user = null;
		event.locals.session = null;
	} else {
		const { session, user } = await validateSessionToken(sessionToken);

		if (session !== null) {
			if (!authorization) setSessionTokenCookie(event, sessionToken, session.expiresAt);
			event.locals.user = user;
			event.locals.session = session;
			event.locals.authMethod = authorization ? 'bearer' : 'cookie';
			if (authorization) restoreNativeContentType(event);
		} else {
			if (authorization) return finish(json({ message: 'Mobile session expired or revoked. Sign in again.' }, { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } }));
			deleteSessionTokenCookie(event);
			event.locals.user = null;
			event.locals.session = null;
		}
	}

	const account = event.locals.user;
	if (account && ['PENDING', 'REJECTED'].includes(account.accountStatus) && !['/account-status', '/logout', '/api/auth/session', '/api/auth/logout', '/api/account'].includes(pathname)) {
		if (api) return finish(json({ message: 'Government account approval is required.', accountStatus: account.accountStatus }, { status: 403 }));
		redirect(303, '/account-status');
	}
	if (pathname === '/admin' || pathname.startsWith('/admin/')) {
		if (!account) redirect(303, '/login?redirectTo=/admin');
		if (account.role !== 'ADMIN') error(403, 'Administrator access required.');
	}
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

	return finish(await resolve(event));
};
