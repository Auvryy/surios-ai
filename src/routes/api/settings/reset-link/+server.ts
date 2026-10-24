import { json } from '@sveltejs/kit';
import { requireApiUser } from '$lib/server/api-access';
import { requestPasswordReset } from '$lib/server/password-security';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => json({ message: await requestPasswordReset(event, requireApiUser(event).email, true) });
