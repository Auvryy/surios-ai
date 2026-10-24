import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { readApiJson, requireApiOrigin } from '$lib/server/api-access';
import { requestPasswordReset } from '$lib/server/password-security';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	requireApiOrigin(event);
	const { email } = await readApiJson(event, z.object({ email: z.string().trim().email().max(254) }).strict());
	return json({ message: await requestPasswordReset(event, email) });
};
