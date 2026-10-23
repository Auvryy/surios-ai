import { error, fail, isHttpError, redirect } from '@sveltejs/kit';
import { eq, sql } from 'drizzle-orm';
import { db, users } from '$lib/server/db';
import { emailPreferences, mailConfiguration } from '$lib/server/email';
import { changePasswordAction, requestPasswordReset, requireOrigin } from '$lib/server/password-security';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, setHeaders }) => {
	if (!locals.user) redirect(303, '/login?redirectTo=/settings');
	setHeaders({ 'Cache-Control': 'no-store' });
	return { preferences: emailPreferences(locals.user.settings), email: locals.user.email, mailAvailable: !!mailConfiguration() };
};
export const actions: Actions = {
	saveNotifications: async (event) => {
		if (!event.locals.user) error(401, 'Sign in to save your preferences.');
		requireOrigin(event);
		const form = await event.request.formData();
		const preferences = { emailComments: form.get('emailComments') === 'on', emailConfirmations: form.get('emailConfirmations') === 'on' };
		await db.update(users).set({ settings: sql`coalesce(${users.settings}, '{}'::jsonb) || ${JSON.stringify(preferences)}::jsonb`, updatedAt: new Date() }).where(eq(users.id, event.locals.user.id));
		return { section: 'notifications', success: 'Email preferences saved.' };
	},
	changePassword: changePasswordAction,
	sendResetLink: async (event) => {
		if (!event.locals.user) error(401, 'Sign in to request a reset link.');
		try { return { section: 'recovery', success: await requestPasswordReset(event, event.locals.user.email, true) }; }
		catch (cause) { if (isHttpError(cause)) return fail(cause.status, { section: 'recovery', error: cause.body.message }); throw cause; }
	}
};
