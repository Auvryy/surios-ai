import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { readApiJson, requireApiUser, requireMutationOrigin } from '$lib/server/api-access';
import { accountDecisionSchema, decideAccount, requireAdministrator } from '$lib/server/account-admin';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async (event) => {
	const user = requireAdministrator(requireApiUser(event));
	requireMutationOrigin(event);
	const { decision } = await readApiJson(event, z.object({ decision: accountDecisionSchema.shape.decision }).strict());
	const parsed = accountDecisionSchema.safeParse({ id: event.params.id, decision });
	if (!parsed.success) error(400, 'Invalid account action.');
	return json(await decideAccount(user, parsed.data));
};
