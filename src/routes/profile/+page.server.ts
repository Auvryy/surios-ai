import { changePasswordAction } from '$lib/server/password-security';
import { fail, isHttpError, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { loadProfile } from '$lib/server/profiles';
import { accountPatchSchema, updateAccount } from '$lib/server/accounts';
import { requireMutationOrigin } from '$lib/server/api-access';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) redirect(303, '/login?redirectTo=/profile');
	return loadProfile(locals.user.id, locals.user.id, url);
};

export const actions: Actions = {
	updateProfile: async (event) => {
		const { request, locals } = event;
		if (!locals.user) {
			throw redirect(303, '/login');
		}
		requireMutationOrigin(event);

		const formData = await request.formData();
		const name = (formData.get('name') as string)?.trim();
		const email = (formData.get('email') as string)?.trim().toLowerCase();
		const department = (formData.get('department') as string)?.trim() || null;
		const badgeNumber = (formData.get('badgeNumber') as string)?.trim() || null;

		const parsed = accountPatchSchema.safeParse({ name, email, department, badgeNumber });
		if (!parsed.success) return fail(400, { error: parsed.error.issues[0].message });

		try {
			locals.user = await updateAccount(locals.user.id, parsed.data);

			return { success: 'Official profile details updated successfully in the municipal database.' };
		} catch (cause) {
			if (isHttpError(cause)) return fail(cause.status === 409 ? 400 : cause.status, { error: cause.body.message });
			console.error('[Update Profile Error]', cause);
			return fail(500, { error: 'Could not update profile. Please try again.' });
		}
	},

	changePassword: changePasswordAction,

};
