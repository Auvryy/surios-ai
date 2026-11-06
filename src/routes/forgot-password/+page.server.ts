import { normalizeOtpCode } from '$lib/otp-code';
import { fail, isHttpError, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { mailConfiguration } from '$lib/server/email';
import { requestPasswordReset, resetAccountPasswordWithCode, requireOrigin } from '$lib/server/password-security';
import type { Actions, PageServerLoad } from './$types';
export const load: PageServerLoad = ({ setHeaders }) => { setHeaders({ 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' }); return { mailAvailable: !!mailConfiguration() }; };
export const actions: Actions = {
	requestCode: async (event) => {
		requireOrigin(event);
		const form = await event.request.formData();
		const email = z.string().trim().max(254).email().safeParse(form.get('email'));
		if (!email.success) return fail(400, { error: 'Enter a valid email address.' });
		try { await requestPasswordReset(event, email.data); return { codePending: true, email: email.data }; }
		catch (cause) { if (isHttpError(cause)) return fail(cause.status, { error: cause.body.message }); throw cause; }
	},
	resend: async (event) => {
		requireOrigin(event);
		const form = await event.request.formData();
		const email = z.string().trim().max(254).email().safeParse(form.get('email'));
		if (!email.success) return fail(400, { codePending: true, error: 'Enter a valid email address.' });
		try { const notice = await requestPasswordReset(event, email.data); return { codePending: true, email: email.data, notice }; }
		catch (cause) { if (isHttpError(cause)) return fail(cause.status, { codePending: true, email: email.data, error: cause.body.message }); throw cause; }
	},
	verify: async (event) => {
		requireOrigin(event);
		const form = await event.request.formData();
		const email = String(form.get('email') || '').trim().toLowerCase();
		try {
			await resetAccountPasswordWithCode({ email, code: normalizeOtpCode(String(form.get('code') || '')), newPassword: String(form.get('newPassword') || ''), confirmPassword: String(form.get('confirmPassword') || '') });
		} catch (cause) {
			if (isHttpError(cause)) return fail(cause.status, { codePending: true, email, error: cause.body.message });
			throw cause;
		}
		redirect(303, '/login?passwordReset=1');
	}
};
