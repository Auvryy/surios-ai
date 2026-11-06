import { normalizeOtpCode } from '$lib/otp-code';
import { error, fail, isHttpError, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { registrationSchema } from '$lib/server/accounts';
import { emailOtpAvailable, startRegistrationCode, confirmRegistrationCode, resendRegistrationCode } from '$lib/server/registration-otp';
import { generateSessionToken, createSession, setSessionTokenCookie } from '$lib/server/auth';
import { workspaceRedirect } from '$lib/server/workspace';

export const load: PageServerLoad = ({ url }) => ({ redirectTo: url.searchParams.get('redirectTo') || '', mailAvailable: emailOtpAvailable() });
export const actions: Actions = {
	start: async (event) => {
		const form = await event.request.formData();
		const text = (key: string) => typeof form.get(key) === 'string' ? String(form.get(key)).trim() : '';
		const fields = { name: text('name'), email: text('email').toLowerCase(), role: text('role') || 'CITIZEN', department: text('department'), level: text('level') || 'MUNICIPAL', jurisdiction: text('jurisdiction'), badgeNumber: text('badgeNumber') };
		const parsed = registrationSchema.safeParse({ ...fields, password: form.get('password'), confirmPassword: form.get('confirmPassword') });
		if (!parsed.success) return fail(400, { ...fields, error: parsed.error.issues[0].message });
		try {
			if (!emailOtpAvailable()) error(503, 'Email verification is currently unavailable. Please try again later.');
			const pending = await startRegistrationCode(parsed.data);
			return { ...fields, codePending: true, email: pending.email };
		} catch (cause) {
			if (isHttpError(cause)) return fail(cause.status === 409 ? 400 : cause.status, { ...fields, error: cause.body.message });
			console.error('[Registration Error]', cause);
			return fail(500, { ...fields, error: 'Could not create account. Please try again.' });
		}
	},
	verify: async (event) => {
		const form = await event.request.formData();
		const email = String(form.get('email') || '').trim().toLowerCase();
		const code = normalizeOtpCode(String(form.get('code') || ''));
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\d{6}$/.test(code)) return fail(400, { codePending: true, email, error: 'Enter the 6-digit code sent to your email.' });
		let destination: string;
		try {
			const user = await confirmRegistrationCode(email, code);
			const token = generateSessionToken();
			const session = await createSession(token, user.id, { ipAddress: event.getClientAddress(), userAgent: event.request.headers.get('user-agent') || undefined });
			setSessionTokenCookie(event, token, session.expiresAt);
			destination = ['PENDING', 'REJECTED'].includes(user.accountStatus) ? '/account-status' : user.role === 'ADMIN' ? '/admin' : workspaceRedirect(String(form.get('redirectTo') || ''), user.role);
		} catch (cause) {
			if (isHttpError(cause)) return fail(cause.status, { codePending: true, email, error: cause.body.message });
			console.error('[Registration Verification Error]', cause);
			return fail(500, { codePending: true, email, error: 'The code could not be verified. Please try again.' });
		}
		redirect(303, destination);
	},
	resend: async (event) => {
		const form = await event.request.formData();
		const email = String(form.get('email') || '').trim().toLowerCase();
		try {
			const notice = await resendRegistrationCode(email);
			return { codePending: true, email, notice };
		} catch (cause) {
			if (isHttpError(cause)) return fail(cause.status, { codePending: true, email, error: cause.body.message });
			return fail(500, { codePending: true, email, error: 'A new code could not be sent. Please try again.' });
		}
	}
};
