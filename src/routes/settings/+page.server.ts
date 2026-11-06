import { error, fail, isHttpError, redirect } from '@sveltejs/kit';
import { accountSettings, saveAccountSettings } from '$lib/server/settings';
import { changePasswordAction, requestPasswordReset, resetAccountPasswordWithCode, requireOrigin } from '$lib/server/password-security';
import { deleteSessionTokenCookie } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, setHeaders }) => {
	if (!locals.user) redirect(303, '/login?redirectTo=/settings');
	setHeaders({ 'Cache-Control': 'no-store' });
	return accountSettings(locals.user);
};
export const actions: Actions = {
	saveNotifications: async (event) => {
		if (!event.locals.user) error(401, 'Sign in to save your preferences.');
		requireOrigin(event);
		const form = await event.request.formData();
		const preferences = { emailComments: form.get('emailComments') === 'on', emailConfirmations: form.get('emailConfirmations') === 'on' };
		await saveAccountSettings(event.locals.user.id, preferences);
		return { section: 'notifications', success: 'Email preferences saved.' };
	},
	changePassword: changePasswordAction,
	sendResetCode: async (event) => {
		if (!event.locals.user) error(401, 'Sign in to request a reset code.');
		requireOrigin(event);
		try {
			const notice = await requestPasswordReset(event, event.locals.user.email, true);
			return { section: 'recovery', codePending: true, email: event.locals.user.email, notice };
		} catch (cause) { if (isHttpError(cause)) return fail(cause.status, { section: 'recovery', error: cause.body.message }); throw cause; }
	},
	verifyResetCode: async (event) => {
		if (!event.locals.user) error(401, 'Sign in to reset your password.');
		requireOrigin(event);
		const form = await event.request.formData();
		try {
			await resetAccountPasswordWithCode({ email: event.locals.user.email, code: String(form.get('code') || '').trim(), newPassword: String(form.get('newPassword') || ''), confirmPassword: String(form.get('confirmPassword') || '') });
		} catch (cause) {
			if (isHttpError(cause)) return fail(cause.status, { section: 'recovery', codePending: true, error: cause.body.message });
			throw cause;
		}
		deleteSessionTokenCookie(event);
		redirect(303, '/login?passwordReset=1');
	}
};
