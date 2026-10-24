import { error, json } from '@sveltejs/kit';
import { accountJson, accountPatchSchema, updateAccount } from '$lib/server/accounts';
import { readApiJson, requireApiUser, requireMutationOrigin } from '$lib/server/api-access';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ locals }) => {
	if (!locals.user) error(401, 'Sign in to continue.');
	return json({ user: accountJson(locals.user) });
};
export const PATCH: RequestHandler = async (event) => {
	const user = requireApiUser(event);
	requireMutationOrigin(event);
	return json({ user: accountJson(await updateAccount(user.id, await readApiJson(event, accountPatchSchema))) });
};
