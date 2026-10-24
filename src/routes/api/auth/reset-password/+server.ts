import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { readApiJson, requireApiOrigin } from '$lib/server/api-access';
import { resetAccountPassword } from '$lib/server/password-security';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	requireApiOrigin(event);
	const input = await readApiJson(event, z.object({ token: z.string().max(64), newPassword: z.string().max(128), confirmPassword: z.string().max(128) }).strict());
	return json({ success: await resetAccountPassword(input) });
};
