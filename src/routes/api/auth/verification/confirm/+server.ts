import { normalizeOtpCode } from '$lib/otp-code';
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { accountJson } from '$lib/server/accounts';
import { createMobileSession } from '$lib/server/auth';
import { confirmRegistrationCode } from '$lib/server/registration-otp';
import { limitApiRequests, readApiJson, requireApiOrigin } from '$lib/server/api-access';
import type { RequestHandler } from './$types';

const confirmationSchema = z.object({
	email: z.string().trim().toLowerCase().email().max(254),
	code: z.string().transform(normalizeOtpCode).pipe(z.string().regex(/^\d{6}$/, 'Enter the 6-digit code sent to your email.'))
}).strict();

export const POST: RequestHandler = async (event) => {
	requireApiOrigin(event);
	limitApiRequests(`verification-confirm:${event.getClientAddress()}`, 20, 900000);
	const input = await readApiJson(event, confirmationSchema);
	const user = await confirmRegistrationCode(input.email, input.code);
	const { token, session } = await createMobileSession(user.id, { ipAddress: event.getClientAddress(), userAgent: event.request.headers.get('user-agent') || undefined });
	return json({ accessToken: token, tokenType: 'Bearer', expiresAt: session.expiresAt.toISOString(), user: accountJson(user) });
};
