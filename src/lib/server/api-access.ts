import { error, type RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';

/** Browser previews are opt-in. Native HTTP clients send no Origin header. */
export function isAllowedApiOrigin(origin: string, ownOrigin: string) {
	if (origin === ownOrigin) return true;
	return (process.env.API_ALLOWED_ORIGINS || '').split(',').some((entry) => {
		try {
			const url = new URL(entry.trim());
			return ['http:', 'https:'].includes(url.protocol) && url.origin === origin && url.pathname === '/' && !url.search && !url.hash && !url.username && !url.password;
		} catch { return false; }
	});
}

export function requireApiOrigin(event: RequestEvent) {
	const origin = event.request.headers.get('origin');
	if (origin && !isAllowedApiOrigin(origin, event.url.origin)) error(403, 'Invalid request origin.');
}

/** Restore adapter metadata only after the caller's bearer session is verified. */
export function restoreNativeContentType(event: RequestEvent) {
	const request = event.platform?.req;
	const key = Symbol.for('surios.native-api-content-type');
	if (!request || !Object.hasOwn(request, key)) return;
	const contentType: unknown = Reflect.get(request, key);
	if (typeof contentType === 'string') event.request.headers.set('content-type', contentType);
	else event.request.headers.delete('content-type');
}

/** A bearer credential authorizes native requests; cookies still require CSRF protection. */
export function requireMutationOrigin(event: RequestEvent) {
	if (event.locals.authMethod === 'bearer' && event.url.pathname.startsWith('/api/')) {
		requireApiOrigin(event);
		return;
	}
	if (!event.locals.user && event.url.pathname.startsWith('/api/')) {
		requireApiOrigin(event);
		return;
	}
	if (event.request.headers.get('origin') !== event.url.origin) error(403, 'Invalid request origin.');
}

export function requireApiUser(event: RequestEvent) {
	if (!event.locals.user) error(401, 'Sign in to continue.');
	if (event.locals.user.accountStatus !== 'ACTIVE') error(403, 'Account approval is required.');
	return event.locals.user;
}

/** Bounded JSON input for account/settings endpoints. Uploads use their existing limits. */
export async function readApiJson<T extends z.ZodType>(event: RequestEvent, schema: T): Promise<z.output<T>> {
	if (event.request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') error(415, 'Send application/json.');
	if (Number(event.request.headers.get('content-length')) > 16384) error(413, 'The JSON request is too large.');
	const reader = event.request.body?.getReader();
	if (!reader) error(400, 'A JSON request body is required.');
	const parts: Uint8Array[] = [];
	let size = 0;
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			size += value.byteLength;
			if (size > 16384) error(413, 'The JSON request is too large.');
			parts.push(value);
		}
	} finally {
		// Cancel destroys Node's socket before the JSON error can be delivered.
		// Release it instead; the adapter drains unread bytes after the response.
		reader.releaseLock();
	}
	const bytes = new Uint8Array(size);
	let offset = 0;
	for (const part of parts) { bytes.set(part, offset); offset += part.byteLength; }
	let input: unknown;
	try { input = JSON.parse(new TextDecoder().decode(bytes)); }
	catch { error(400, 'Send valid JSON.'); }
	const parsed = schema.safeParse(input);
	if (!parsed.success) error(400, parsed.error.issues[0]?.message || 'Check your request.');
	return parsed.data;
}

const attempts = new Map<string, { count: number; until: number }>();
export function limitApiRequests(key: string, count: number, windowMs: number) {
	const now = Date.now();
	for (const [key, value] of attempts) if (value.until <= now) attempts.delete(key);
	const value = attempts.get(key) || { count: 0, until: now + windowMs };
	if (value.count >= count || attempts.size >= 10000 && !attempts.has(key)) error(429, 'Too many requests. Try again later.');
	value.count++;
	attempts.set(key, value);
}
