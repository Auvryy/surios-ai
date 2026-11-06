import { error, json } from '@sveltejs/kit';
import { registrationSchema } from '$lib/server/accounts';
import { emailOtpAvailable, startRegistrationCode } from '$lib/server/registration-otp';
import { limitApiRequests, readApiJson, requireApiOrigin } from '$lib/server/api-access';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	requireApiOrigin(event);
	limitApiRequests(`register:${event.getClientAddress()}`, 20, 3600000);
	if (!emailOtpAvailable()) error(503, 'Email verification is currently unavailable. Please try again later.');
	const input = await readApiJson(event, registrationSchema);
	const pending = await startRegistrationCode(input);
	return json({ verificationRequired: true, email: pending.email }, { status: 202 });
};
