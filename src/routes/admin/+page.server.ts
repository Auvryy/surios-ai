import { fail, isHttpError } from '@sveltejs/kit';
import { accountDecisionSchema, decideAccount, loadAccountAdministration, requireAdministrator } from '$lib/server/account-admin';
import { requireMutationOrigin } from '$lib/server/api-access';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => loadAccountAdministration(locals.user);
export const actions: Actions = {
	update: async (event) => {
		requireAdministrator(event.locals.user);
		requireMutationOrigin(event);
		const form = await event.request.formData();
		const parsed = accountDecisionSchema.safeParse({ id: form.get('id'), decision: form.get('decision') });
		if (!parsed.success) return fail(400, { error: 'Invalid account action.' });
		try { return await decideAccount(event.locals.user, parsed.data); }
		catch (cause) { if (isHttpError(cause)) return fail(cause.status, { error: cause.body.message }); throw cause; }
	}
};
