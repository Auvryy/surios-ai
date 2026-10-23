import { error, type RequestEvent } from '@sveltejs/kit';
import { isGovernmentUser } from './workspace';

export function requireGovernmentUser(event: RequestEvent) {
	if (!event.locals.user) error(401, 'Sign in to publish government updates.');
	if (!isGovernmentUser(event.locals.user.role)) error(403, 'Government access required.');
	if (event.request.method !== 'GET' && event.request.headers.get('origin') !== event.url.origin) error(403, 'Invalid request origin.');
	return event.locals.user;
}

export function csvCell(value: unknown) {
	let text = String(value ?? '');
	if (/^\s*[=+\-@]/.test(text)) text = `'${text}`;
	return `"${text.replaceAll('"', '""')}"`;
}
