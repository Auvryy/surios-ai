import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db, users } from '$lib/server/db';
import { workspaceRedirect } from '$lib/server/workspace';
import { hashPassword, generateSessionToken, createSession, setSessionTokenCookie } from '$lib/server/auth';

const schema = z.object({
	name: z.string().min(2, 'Full name must be at least 2 characters').max(120),
	email: z.string().email('Please enter a valid email address').max(254),
	password: z.string().min(8, 'Password must be at least 8 characters').max(256),
	confirmPassword: z.string({ error: 'Please confirm your password.' }).min(1, 'Please confirm your password.').max(256),
	role: z.enum(['CITIZEN', 'OFFICER'], { error: 'Choose Citizen or Government.' }),
	department: z.string().max(160),
	level: z.enum(['MUNICIPAL', 'BARANGAY']),
	jurisdiction: z.string().max(120),
	badgeNumber: z.string().max(80)
}).superRefine((value, ctx) => {
	if (value.password !== value.confirmPassword) ctx.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'Passwords do not match.' });
	if (value.role === 'OFFICER') for (const field of ['department', 'jurisdiction', 'badgeNumber'] as const) {
		if (value[field].length < 2) ctx.addIssue({ code: 'custom', path: [field], message: `${field === 'department' ? 'Office / department' : field === 'jurisdiction' ? 'Work location' : 'Government ID number'} is required.` });
	}
});
export const load: PageServerLoad = ({ url }) => ({ redirectTo: url.searchParams.get('redirectTo') || '' });
export const actions: Actions = {
	default: async (event) => {
		const form = await event.request.formData();
		const text = (key: string) => typeof form.get(key) === 'string' ? String(form.get(key)).trim() : '';
		const fields = { name: text('name'), email: text('email').toLowerCase(), role: text('role') || 'CITIZEN', department: text('department'), level: text('level') || 'MUNICIPAL', jurisdiction: text('jurisdiction'), badgeNumber: text('badgeNumber') };
		const parsed = schema.safeParse({ ...fields, password: form.get('password'), confirmPassword: form.get('confirmPassword') });
		if (!parsed.success) return fail(400, { ...fields, error: parsed.error.issues[0].message });
		const value = parsed.data;
		const government = value.role === 'OFFICER';
		try {
			if ((await db.select({ id: users.id }).from(users).where(eq(users.email, value.email))).length) return fail(400, { ...fields, error: 'An account with this email address already exists.' });
			const [user] = await db.insert(users).values({
				name: value.name, email: value.email, passwordHash: hashPassword(value.password), role: value.role,
				accountStatus: government ? 'PENDING' : 'ACTIVE',
				department: government ? value.department : null,
				badgeNumber: government ? value.badgeNumber : null,
				governmentProfile: government ? { level: value.level, jurisdiction: value.jurisdiction, bio: '' } : null
			}).returning();
			const token = generateSessionToken();
			const session = await createSession(token, user.id, { ipAddress: event.getClientAddress(), userAgent: event.request.headers.get('user-agent') || undefined });
			setSessionTokenCookie(event, token, session.expiresAt);
		} catch (cause) {
			console.error('[Registration Error]', cause);
			return fail(500, { ...fields, error: 'Could not create account. Please try again.' });
		}
		redirect(303, government ? '/account-status' : workspaceRedirect(text('redirectTo'), value.role));
	}
};
