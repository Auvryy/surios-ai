import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { resendRegistrationCode } from '$lib/server/registration-otp';
import { limitApiRequests, readApiJson, requireApiOrigin } from '$lib/server/api-access';
import type { RequestHandler } from './$types';

const resendSchema = z.object({ email: z.string().trim().toLowerCase().email().max(254) }).strict();

export const POST: RequestHandler = async (event) => {
	requireApiOrigin(event);
	limitApiRequests(`verification-resend:${event.getClientAddress()}`, 10, 3600000);
	const input = await readApiJson(event, resendSchema);
	return json({ message: await resendRegistrationCode(input.email) });
};
