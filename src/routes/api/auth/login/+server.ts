import { json } from '@sveltejs/kit';
import { createHash } from 'node:crypto';
import { authenticateAccount, accountJson, loginSchema } from '$lib/server/accounts';
import { createMobileSession } from '$lib/server/auth';
import { limitApiRequests, readApiJson, requireApiOrigin } from '$lib/server/api-access';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	requireApiOrigin(event);
	limitApiRequests(`login-ip:${event.getClientAddress()}`, 100, 900000);
	const input = await readApiJson(event, loginSchema);
	limitApiRequests(`login-account:${createHash('sha256').update(input.email).digest('hex')}`, 20, 900000);
	const user = await authenticateAccount(input.email, input.password);
	const { token, session } = await createMobileSession(user.id, { ipAddress: event.getClientAddress(), userAgent: event.request.headers.get('user-agent') || undefined });
	return json({ accessToken: token, tokenType: 'Bearer', expiresAt: session.expiresAt.toISOString(), user: accountJson(user) });
};
