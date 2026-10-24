import { json } from '@sveltejs/kit';
import { readApiJson, requireApiUser, requireMutationOrigin } from '$lib/server/api-access';
import { accountSettings, saveAccountSettings, settingsPatchSchema } from '$lib/server/settings';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = (event) => json(accountSettings(requireApiUser(event)));
export const PATCH: RequestHandler = async (event) => {
	const user = requireApiUser(event);
	requireMutationOrigin(event);
	return json(await saveAccountSettings(user.id, await readApiJson(event, settingsPatchSchema)));
};
