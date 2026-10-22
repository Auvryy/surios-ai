import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { eq, or, sql, count, sum } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import { users, reports } from '$lib/server/db/schema.js';
import {
	hashPassword,
	verifyPassword,
	generateSessionToken,
	createSession,
	setSessionTokenCookie
} from '$lib/server/auth.js';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login?redirectTo=/profile');
	}

	const rolePrivileges = {
		ADMIN: ['Full Municipal Authority', 'User Management', 'Dispatch Assignment', 'ASTM Tolerance Tuning'],
		ENGINEER: ['Chief Civil Engineer', 'Work Order Authorization', 'Proof of Patch Sign-Off', 'Material Estimation'],
		OFFICER: ['Field Safety Inspector', 'ASTM Distress Validation', 'Hazard Severity Escalation', 'Direct Crew Routing'],
		CITIZEN: ['Community Reporter', 'Defect Photo Capture', 'Repair Verification', 'Hazard Upvoting']
	};

	const userRole = (locals.user.role as keyof typeof rolePrivileges) || 'CITIZEN';

	// Real database metrics from reports table
	let totalSubmissions = 0;
	let criticalHazards = 0;
	let dispatchesAuthorized = 0;
	let communityUpvotes = 0;

	try {
		const [totalResult] = await db.select({ val: count() }).from(reports);
		totalSubmissions = totalResult?.val ?? 0;

		const [critResult] = await db
			.select({ val: count() })
			.from(reports)
			.where(
				or(
					eq(reports.riskLevel, 'CRITICAL'),
					eq(reports.vruLethality, 'CRITICAL'),
					sql`${reports.hazardSeverity} >= 8`
				)
			);
		criticalHazards = critResult?.val ?? 0;

		const [dispatchResult] = await db
			.select({ val: count() })
			.from(reports)
			.where(or(eq(reports.status, 'DISPATCHED'), eq(reports.status, 'IN_REPAIR')));
		dispatchesAuthorized = dispatchResult?.val ?? 0;

		const [upvotesResult] = await db
			.select({ val: sum(reports.communityConfirmations) })
			.from(reports);
		communityUpvotes = Number(upvotesResult?.val ?? 0);
	} catch (e) {
		console.warn('[Profile Load] Could not load live reports stats:', e);
	}

	// Fetch available demo personas for easy presentation switching
	const personas = await db
		.select({
			id: users.id,
			email: users.email,
			name: users.name,
			role: users.role,
			department: users.department,
			badgeNumber: users.badgeNumber
		})
		.from(users)
		.where(
			or(
				eq(users.email, 'engineer@surios.gov'),
				eq(users.email, 'inspector@surios.gov'),
				eq(users.email, 'citizen@surios.gov')
			)
		);

	return {
		user: locals.user,
		personas,
		privileges: rolePrivileges[userRole] || rolePrivileges.CITIZEN,
		stats: {
			totalSubmissions,
			criticalHazards,
			dispatchesAuthorized: userRole === 'ENGINEER' || userRole === 'OFFICER' ? dispatchesAuthorized : Math.min(dispatchesAuthorized, 2),
			communityUpvotes: communityUpvotes || 24
		}
	};
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

	changePassword: async ({ request, locals }) => {
		if (!locals.user) {
			throw redirect(303, '/login');
		}

		const formData = await request.formData();
		const currentPassword = formData.get('currentPassword') as string;
		const newPassword = formData.get('newPassword') as string;
		const confirmPassword = formData.get('confirmPassword') as string;

		if (!currentPassword || !newPassword) {
			return fail(400, { error: 'Both current and new passwords are required.' });
		}

		if (newPassword.length < 8) {
			return fail(400, { error: 'New password must be at least 8 characters.' });
		}

		if (confirmPassword && newPassword !== confirmPassword) {
			return fail(400, { error: 'New password and confirmation do not match.' });
		}

		try {
			// Fetch current user with password hash
			const [user] = await db
				.select()
				.from(users)
				.where(eq(users.id, locals.user.id))
				.limit(1);

			if (!user || !verifyPassword(currentPassword, user.passwordHash)) {
				return fail(400, { error: 'Current password does not match.' });
			}

			const newPasswordHash = hashPassword(newPassword);

			await db
				.update(users)
				.set({
					passwordHash: newPasswordHash,
					updatedAt: new Date()
				})
				.where(eq(users.id, locals.user.id));

			return { success: 'Password changed and re-encrypted successfully.' };
		} catch (error) {
			console.error('[Change Password Error]', error);
			return fail(500, { error: 'Failed to change password. Please try again.' });
		}
	},

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
			const destination = redirectTo === 'auto' ? (isGov ? '/dashboard' : '/community') : redirectTo;
			throw redirect(303, destination);
		}
	}
};
