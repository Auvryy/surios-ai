import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import { users } from '$lib/server/db/schema.js';
import { hashPassword, verifyPassword } from '$lib/server/auth.js';

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

	return {
		user: locals.user,
		privileges: rolePrivileges[userRole] || rolePrivileges.CITIZEN,
		stats: {
			totalSubmissions: 12,
			verifiedDistresses: 9,
			dispatchesAuthorized: userRole === 'ENGINEER' || userRole === 'OFFICER' ? 6 : 0,
			communityUpvotes: 28
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
		const department = (formData.get('department') as string)?.trim() || null;

		if (!name || name.length < 2) {
			return fail(400, { error: 'Full name must be at least 2 characters.' });
		}

		try {
			await db
				.update(users)
				.set({
					name,
					department,
					updatedAt: new Date()
				})
				.where(eq(users.id, locals.user.id));

			return { success: 'Profile details updated successfully.' };
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

		if (!currentPassword || !newPassword) {
			return fail(400, { error: 'Both current and new passwords are required.' });
		}

		if (newPassword.length < 8) {
			return fail(400, { error: 'New password must be at least 8 characters.' });
		}

		try {
			// Fetch current user with password hash
			const [user] = await db
				.select()
				.from(users)
				.where(eq(users.id, locals.user.id))
				.limit(1);

			if (!user || !verifyPassword(currentPassword, user.passwordHash)) {
				return fail(400, { error: 'Current password is incorrect.' });
			}

			const newPasswordHash = hashPassword(newPassword);

			await db
				.update(users)
				.set({
					passwordHash: newPasswordHash,
					updatedAt: new Date()
				})
				.where(eq(users.id, locals.user.id));

			return { success: 'Password changed successfully.' };
		} catch (error) {
			console.error('[Change Password Error]', error);
			return fail(500, { error: 'Failed to change password. Please try again.' });
		}
	}
};
