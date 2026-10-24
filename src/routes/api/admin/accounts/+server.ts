import { json } from '@sveltejs/kit';
import { requireApiUser } from '$lib/server/api-access';
import { loadAccountAdministration } from '$lib/server/account-admin';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => json(await loadAccountAdministration(requireApiUser(event)));
