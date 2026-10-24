import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, users, type User } from './db';
import { hashPassword, verifyPassword } from './auth';

export const loginSchema = z.object({
	email: z.string().trim().toLowerCase().email('Please enter a valid email address').max(254),
	password: z.string().min(1, 'Password is required').max(256)
}).strict();

export const registrationSchema = z.object({
	name: z.string().trim().min(2, 'Full name must be at least 2 characters').max(120),
	email: z.string().trim().toLowerCase().email('Please enter a valid email address').max(254),
	password: z.string().min(8, 'Password must be at least 8 characters').max(256),
	confirmPassword: z.string({ error: 'Please confirm your password.' }).min(1, 'Please confirm your password.').max(256),
	role: z.enum(['CITIZEN', 'OFFICER'], { error: 'Choose Citizen or Government.' }).default('CITIZEN'),
	department: z.string().trim().max(160).default(''),
	level: z.enum(['MUNICIPAL', 'BARANGAY']).default('MUNICIPAL'),
	jurisdiction: z.string().trim().max(120).default(''),
	badgeNumber: z.string().trim().max(80).default('')
}).strict().superRefine((value, ctx) => {
	if (value.password !== value.confirmPassword) ctx.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'Passwords do not match.' });
	if (value.role === 'OFFICER') for (const field of ['department', 'jurisdiction', 'badgeNumber'] as const) {
		if (value[field].length < 2) ctx.addIssue({ code: 'custom', path: [field], message: `${field === 'department' ? 'Office / department' : field === 'jurisdiction' ? 'Work location' : 'Government ID number'} is required.` });
	}
});

const dummyHash = hashPassword('unregistered-account-placeholder');
export async function authenticateAccount(email: string, password: string) {
	const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
	const valid = verifyPassword(password, user?.passwordHash || dummyHash);
	if (!user || !valid) error(401, 'Invalid email or password');
	if (user.accountStatus === 'INACTIVE') error(403, 'This account is inactive. Contact your administrator.');
	return user;
}

export async function registerAccount(value: z.output<typeof registrationSchema>) {
	const government = value.role === 'OFFICER';
	const [user] = await db.insert(users).values({
		name: value.name, email: value.email, passwordHash: hashPassword(value.password), role: value.role,
		accountStatus: government ? 'PENDING' : 'ACTIVE',
		department: government ? value.department : null,
		badgeNumber: government ? value.badgeNumber : null,
		governmentProfile: government ? { level: value.level, jurisdiction: value.jurisdiction, bio: '' } : null
	}).onConflictDoNothing({ target: users.email }).returning();
	if (!user) error(409, 'An account with this email address already exists.');
	return user;
}

/** Own-account JSON deliberately omits password hashes and internal review identifiers. */
export function accountJson(user: User) {
	return {
		id: user.id, name: user.name, email: user.email, role: user.role,
		accountStatus: user.accountStatus, avatarUrl: user.avatarUrl, coverUrl: user.coverUrl,
		department: user.department, badgeNumber: user.badgeNumber, governmentProfile: user.governmentProfile,
		createdAt: user.createdAt.toISOString(), updatedAt: user.updatedAt.toISOString()
	};
}

export const accountPatchSchema = z.object({
	name: z.string().trim().min(2, 'Full name must be at least 2 characters.').max(120).optional(),
	email: z.string().trim().toLowerCase().email('Please enter a valid email address.').max(254).optional(),
	department: z.string().trim().max(160).nullable().optional(),
	badgeNumber: z.string().trim().max(80).nullable().optional()
}).strict().refine((value) => Object.keys(value).length > 0, 'Choose an account detail to update.');

export async function updateAccount(userId: string, input: z.output<typeof accountPatchSchema>) {
	try {
		const [user] = await db.update(users).set({ ...input, updatedAt: new Date() }).where(eq(users.id, userId)).returning();
		if (!user) error(404, 'Account not found.');
		return user;
	} catch (cause) {
		const databaseError = cause as { code?: string; cause?: { code?: string } };
		if ((databaseError.cause?.code || databaseError.code) === '23505') error(409, 'This email address is already in use by another account.');
		throw cause;
	}
}
