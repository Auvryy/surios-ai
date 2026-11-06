import { fail, isHttpError, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { limitApiRequests, requireMutationOrigin } from '$lib/server/api-access';
import { emailVerificationAvailable, requestVerificationEmail, verifyEmailToken } from '$lib/server/email-verification';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url, setHeaders }) => {
	setHeaders({ 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' });
	return { token: url.searchParams.get('token') || '', sent: url.searchParams.get('sent') === '1', verified: url.searchParams.get('verified') === '1', mailAvailable: emailVerificationAvailable() };
};

export const actions: Actions = {
	verify: async (event) => {
		requireMutationOrigin(event);
		const form = await event.request.formData();
		const token = z.string().regex(/^[a-f0-9]{64}$/).safeParse(form.get('token'));
		if (!token.success) return fail(400, { error: 'This verification link is invalid or expired. Request a new one below.' });
		if (!await verifyEmailToken(token.data)) return fail(400, { error: 'This verification link is invalid or expired. Request a new one below.' });
		redirect(303, '/verify-email?verified=1');
	},
	resend: async (event) => {
		requireMutationOrigin(event);
		limitApiRequests(`verification-resend-web:${event.getClientAddress()}`, 10, 3600000);
		const form = await event.request.formData();
		const email = z.string().trim().toLowerCase().email().max(254).safeParse(form.get('email'));
		if (!email.success) return fail(400, { error: 'Enter a valid email address.' });
		try { return { resent: true, message: await requestVerificationEmail(email.data) }; }
		catch (cause) {
			if (isHttpError(cause)) return fail(cause.status, { error: cause.body.message });
			throw cause;
		}
	}
};
