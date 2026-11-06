import { normalizeOtpCode } from '$lib/otp-code';
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { readApiJson, requireApiOrigin } from '$lib/server/api-access';
import { resetAccountPassword, resetAccountPasswordWithCode } from '$lib/server/password-security';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	requireApiOrigin(event);
	const input = await readApiJson(event, z.union([
		z.object({ token: z.string().max(64), newPassword: z.string().max(128), confirmPassword: z.string().max(128) }).strict(),
		z.object({ email: z.string().trim().toLowerCase().email().max(254), code: z.string().transform(normalizeOtpCode).pipe(z.string().regex(/^\d{6}$/)), newPassword: z.string().max(128), confirmPassword: z.string().max(128) }).strict()
	]));
	const success = 'token' in input ? await resetAccountPassword(input) : await resetAccountPasswordWithCode(input);
	return json({ success });
};
