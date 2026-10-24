import { json } from '@sveltejs/kit';
import { accountJson, registerAccount, registrationSchema } from '$lib/server/accounts';
import { createMobileSession } from '$lib/server/auth';
import { limitApiRequests, readApiJson, requireApiOrigin } from '$lib/server/api-access';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	requireApiOrigin(event);
	limitApiRequests(`register:${event.getClientAddress()}`, 20, 3600000);
	const input = await readApiJson(event, registrationSchema);
	const user = await registerAccount(input);
	const { token, session } = await createMobileSession(user.id, { ipAddress: event.getClientAddress(), userAgent: event.request.headers.get('user-agent') || undefined });
	return json({ accessToken: token, tokenType: 'Bearer', expiresAt: session.expiresAt.toISOString(), user: accountJson(user) }, { status: 201 });
};
