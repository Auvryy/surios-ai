import { fail, isHttpError, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { workspaceRedirect } from '$lib/server/workspace';
import { registerAccount, registrationSchema } from '$lib/server/accounts';
import { generateSessionToken, createSession, setSessionTokenCookie } from '$lib/server/auth';

export const load: PageServerLoad = ({ url }) => ({ redirectTo: url.searchParams.get('redirectTo') || '' });
export const actions: Actions = {
	default: async (event) => {
		const form = await event.request.formData();
		const text = (key: string) => typeof form.get(key) === 'string' ? String(form.get(key)).trim() : '';
		const fields = { name: text('name'), email: text('email').toLowerCase(), role: text('role') || 'CITIZEN', department: text('department'), level: text('level') || 'MUNICIPAL', jurisdiction: text('jurisdiction'), badgeNumber: text('badgeNumber') };
		const parsed = registrationSchema.safeParse({ ...fields, password: form.get('password'), confirmPassword: form.get('confirmPassword') });
		if (!parsed.success) return fail(400, { ...fields, error: parsed.error.issues[0].message });
		try {
			const user = await registerAccount(parsed.data);
			const token = generateSessionToken();
			const session = await createSession(token, user.id, { ipAddress: event.getClientAddress(), userAgent: event.request.headers.get('user-agent') || undefined });
			setSessionTokenCookie(event, token, session.expiresAt);
		} catch (cause) {
			if (isHttpError(cause)) return fail(cause.status === 409 ? 400 : cause.status, { ...fields, error: cause.body.message });
			console.error('[Registration Error]', cause);
			return fail(500, { ...fields, error: 'Could not create account. Please try again.' });
		}
		redirect(303, parsed.data.role === 'OFFICER' ? '/account-status' : workspaceRedirect(text('redirectTo'), parsed.data.role));
	}
};
