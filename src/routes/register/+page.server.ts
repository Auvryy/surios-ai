import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import { users } from '$lib/server/db/schema.js';
import {
	hashPassword,
	generateSessionToken,
	createSession,
	setSessionTokenCookie
} from '$lib/server/auth.js';

const registerSchema = z.object({
	name: z.string().min(2, 'Full name must be at least 2 characters'),
	email: z.string().email('Please enter a valid email address'),
	password: z.string().min(8, 'Password must be at least 8 characters'),
	role: z.enum(['CITIZEN', 'OFFICER', 'ENGINEER']).default('CITIZEN'),
	department: z.string().optional()
});

export const load: PageServerLoad = async ({ url }) => {
	const redirectTo = url.searchParams.get('redirectTo') || '';
	return { redirectTo };
};

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const name = (formData.get('name') as string)?.trim();
		const email = (formData.get('email') as string)?.trim()?.toLowerCase();
		const password = formData.get('password') as string;
		const role = (formData.get('role') as string) || 'CITIZEN';
		const department = (formData.get('department') as string)?.trim() || undefined;
		const requestedRedirect = (formData.get('redirectTo') as string)?.trim();

		const validation = registerSchema.safeParse({ name, email, password, role, department });
		if (!validation.success) {
			const error = validation.error.issues[0]?.message || 'Invalid registration form';
			return fail(400, { name, email, role, department, error });
		}

		const isGov = role === 'ENGINEER' || role === 'OFFICER';
		let destination = '/community';
		if (requestedRedirect && requestedRedirect.startsWith('/')) {
			if (isGov || !requestedRedirect.startsWith('/dashboard')) {
				destination = requestedRedirect;
			}
		}

		try {
			const existing = await db
				.select({ id: users.id })
				.from(users)
				.where(eq(users.email, email))
				.limit(1);

			if (existing.length > 0) {
				return fail(400, {
					name,
					email,
					role,
					department,
					error: 'An account with this email address already exists'
				});
			}

			const passwordHash = hashPassword(password);

			const [newUser] = await db
				.insert(users)
				.values({
					name,
					email,
					passwordHash,
					role,
					department
				})
				.returning();

			const sessionToken = generateSessionToken();
			const session = await createSession(sessionToken, newUser.id, {
				ipAddress: event.getClientAddress?.() || undefined,
				userAgent: event.request.headers.get('user-agent') || undefined
			});

			setSessionTokenCookie(event, sessionToken, session.expiresAt);
		} catch (err) {
			console.error('[Registration Error]', err);
			return fail(500, {
				name,
				email,
				role,
				department,
				error: 'Could not create account due to server error. Please try again.'
			});
		}

		throw redirect(303, destination);
	}
};
