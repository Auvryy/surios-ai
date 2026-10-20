import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import { users } from '$lib/server/db/schema.js';
import {
	verifyPassword,
	generateSessionToken,
	createSession,
	setSessionTokenCookie
} from '$lib/server/auth.js';

const loginSchema = z.object({
	email: z.string().email('Please enter a valid email address'),
	password: z.string().min(1, 'Password is required')
});

export const load: PageServerLoad = async ({ url }) => {
	const redirectTo = url.searchParams.get('redirectTo') || '/dashboard';
	return { redirectTo };
};

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const email = (formData.get('email') as string)?.trim()?.toLowerCase();
		const password = formData.get('password') as string;
		const redirectTo = (formData.get('redirectTo') as string) || '/dashboard';

		const validation = loginSchema.safeParse({ email, password });
		if (!validation.success) {
			const error = validation.error.issues[0]?.message || 'Invalid input';
			return fail(400, { email, error });
		}

		try {
			const [user] = await db
				.select()
				.from(users)
				.where(eq(users.email, email))
				.limit(1);

			if (!user || !verifyPassword(password, user.passwordHash)) {
				return fail(400, {
					email,
					error: 'Invalid email or password'
				});
			}

			const sessionToken = generateSessionToken();
			const session = await createSession(sessionToken, user.id, {
				ipAddress: event.getClientAddress?.() || undefined,
				userAgent: event.request.headers.get('user-agent') || undefined
			});

			setSessionTokenCookie(event, sessionToken, session.expiresAt);
		} catch (err) {
			console.error('[Login Error]', err);
			return fail(500, {
				email,
				error: 'Authentication failed due to server error. Please try again.'
			});
		}

		throw redirect(303, redirectTo);
	}
};
