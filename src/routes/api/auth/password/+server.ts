import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { readApiJson, requireApiUser } from '$lib/server/api-access';
import { changeAccountPassword } from '$lib/server/password-security';
import type { RequestHandler } from './$types';

const schema = z.object({ currentPassword: z.string().max(256), newPassword: z.string().max(128), confirmPassword: z.string().max(128) }).strict();
export const POST: RequestHandler = async (event) => {
	requireApiUser(event);
	return json({ success: await changeAccountPassword(event, await readApiJson(event, schema)) });
};
