import { fail, isHttpError, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { workspaceRedirect } from '$lib/server/workspace';
import { authenticateAccount, loginSchema } from '$lib/server/accounts';
import { generateSessionToken, createSession, setSessionTokenCookie } from '$lib/server/auth';

export const load: PageServerLoad = ({ url }) => ({ redirectTo: url.searchParams.get('redirectTo') || '' });
export const actions: Actions = {
	default: async (event) => {
		const form = await event.request.formData();
		const email = String(form.get('email') || '').trim().toLowerCase();
		const validation = loginSchema.safeParse({ email, password: form.get('password') });
		if (!validation.success) return fail(400, { email, error: validation.error.issues[0]?.message || 'Invalid input' });
		let destination: string;
		try {
			const user = await authenticateAccount(validation.data.email, validation.data.password);
			const token = generateSessionToken();
			const session = await createSession(token, user.id, { ipAddress: event.getClientAddress(), userAgent: event.request.headers.get('user-agent') || undefined });
			setSessionTokenCookie(event, token, session.expiresAt);
			destination = ['PENDING', 'REJECTED'].includes(user.accountStatus) ? '/account-status' : user.role === 'ADMIN' ? '/admin' : workspaceRedirect(form.get('redirectTo'), user.role);
		} catch (cause) {
			if (isHttpError(cause)) return fail(cause.status === 401 ? 400 : cause.status, { email, error: cause.body.message });
			console.error('[Login Error]', cause);
			return fail(500, { email, error: 'Authentication failed due to server error. Please try again.' });
		}
		redirect(303, destination);
	}
};
