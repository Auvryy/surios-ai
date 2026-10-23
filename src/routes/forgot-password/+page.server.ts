import { fail, isHttpError } from '@sveltejs/kit';
import { z } from 'zod';
import { mailConfiguration } from '$lib/server/email';
import { requestPasswordReset, requireOrigin } from '$lib/server/password-security';
import type { Actions, PageServerLoad } from './$types';
export const load: PageServerLoad = ({ setHeaders }) => { setHeaders({ 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' }); return { mailAvailable: !!mailConfiguration() }; };
export const actions: Actions = {
	default: async (event) => {
		requireOrigin(event);
		const form = await event.request.formData();
		const email = z.string().trim().max(254).email().safeParse(form.get('email'));
		if (!email.success) return fail(400, { error: 'Enter a valid email address.' });
		try { return { success: await requestPasswordReset(event, email.data) }; }
		catch (cause) { if (isHttpError(cause)) return fail(cause.status, { error: cause.body.message }); throw cause; }
	}
};
