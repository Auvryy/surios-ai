import { changePasswordAction } from '$lib/server/password-security';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { eq } from 'drizzle-orm';
import { db, users } from '$lib/server/db';
import { loadProfile } from '$lib/server/profiles';
import { generateSessionToken, createSession, setSessionTokenCookie } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) redirect(303, '/login?redirectTo=/profile');
	return loadProfile(locals.user.id, locals.user.id, url);
};

export const actions: Actions = {
	updateProfile: async ({ request, locals }) => {
		if (!locals.user) {
			throw redirect(303, '/login');
		}

		const formData = await request.formData();
		const name = (formData.get('name') as string)?.trim();
		const email = (formData.get('email') as string)?.trim().toLowerCase();
		const department = (formData.get('department') as string)?.trim() || null;
		const badgeNumber = (formData.get('badgeNumber') as string)?.trim() || null;

		if (!name || name.length < 2) {
			return fail(400, { error: 'Full name must be at least 2 characters.' });
		}

		if (!email || !email.includes('@')) {
			return fail(400, { error: 'Please enter a valid email address.' });
		}

		try {
			// Check if email was changed and is already taken by someone else
			if (email !== locals.user.email) {
				const [existing] = await db
					.select()
					.from(users)
					.where(eq(users.email, email))
					.limit(1);

				if (existing && existing.id !== locals.user.id) {
					return fail(400, { error: 'This email address is already in use by another officer.' });
				}
			}

			await db
				.update(users)
				.set({
					name,
					email,
					department,
					badgeNumber,
					updatedAt: new Date()
				})
				.where(eq(users.id, locals.user.id));

			// Update in-memory session user object
			locals.user.name = name;
			locals.user.email = email;
			locals.user.department = department;
			locals.user.badgeNumber = badgeNumber;

			return { success: 'Official profile details updated successfully in the municipal database.' };
		} catch (error) {
			console.error('[Update Profile Error]', error);
			return fail(500, { error: 'Could not update profile. Please try again.' });
		}
	},

	changePassword: changePasswordAction,

	switchPersona: async (event) => {
		const formData = await event.request.formData();
		const targetEmail = (formData.get('email') as string)?.trim().toLowerCase();
		const redirectTo = (formData.get('redirectTo') as string)?.trim();

		if (!targetEmail) {
			return fail(400, { error: 'Target persona email is required.' });
		}

		let targetRole = 'CITIZEN';
		try {
			const [targetUser] = await db
				.select()
				.from(users)
				.where(eq(users.email, targetEmail))
				.limit(1);

			if (!targetUser) {
				return fail(404, { error: 'Target persona not found.' });
			}

			targetRole = targetUser.role;
			const sessionToken = generateSessionToken();
			const session = await createSession(sessionToken, targetUser.id, {
				ipAddress: event.getClientAddress?.(),
				userAgent: event.request.headers.get('user-agent') || undefined
			});

			setSessionTokenCookie(event, sessionToken, session.expiresAt);
			event.locals.user = targetUser;
			event.locals.session = session;

			if (!redirectTo) {
				return { success: `Switched active role to ${targetUser.name} (${targetUser.role}).` };
			}
		} catch (err) {
			console.error('[Switch Persona Error]', err);
			return fail(500, { error: 'Failed to switch persona.' });
		}

		if (redirectTo) {
			const isGov = targetRole === 'ENGINEER' || targetRole === 'OFFICER' || targetRole === 'ADMIN';
			const destination = redirectTo === 'auto' ? '/community' : redirectTo;
			throw redirect(303, destination);
		}
	}
};
