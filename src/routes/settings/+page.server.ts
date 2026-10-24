import { error, fail, isHttpError, redirect } from '@sveltejs/kit';
import { accountSettings, saveAccountSettings } from '$lib/server/settings';
import { changePasswordAction, requestPasswordReset, requireOrigin } from '$lib/server/password-security';
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
	sendResetLink: async (event) => {
		if (!event.locals.user) error(401, 'Sign in to request a reset link.');
		try { return { section: 'recovery', success: await requestPasswordReset(event, event.locals.user.email, true) }; }
		catch (cause) { if (isHttpError(cause)) return fail(cause.status, { section: 'recovery', error: cause.body.message }); throw cause; }
	}
};
