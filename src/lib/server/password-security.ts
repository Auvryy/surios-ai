import crypto from 'node:crypto';
import { error, fail, type RequestEvent } from '@sveltejs/kit';
import { and, eq, gt, ne, sql } from 'drizzle-orm';
import { db, users, sessions, passwordResets } from './db';
import { hashPassword, verifyPassword, deleteSessionTokenCookie } from './auth';
import { mailConfiguration, sendEmail } from './email';

export function requireOrigin(event: RequestEvent) {
	if (event.request.headers.get('origin') !== event.url.origin) error(403, 'Invalid request origin.');
}
export function passwordError(password: string, confirmation: string) {
	if (password.length < 8 || password.length > 128) return 'Use a password between 8 and 128 characters.';
	if (password !== confirmation) return 'The passwords do not match.';
	return null;
}
export async function changePasswordAction(event: RequestEvent) {
	if (!event.locals.user || !event.locals.session) error(401, 'Sign in to change your password.');
	requireOrigin(event);
	const form = await event.request.formData();
	const current = String(form.get('currentPassword') || ''), password = String(form.get('newPassword') || ''), confirmation = String(form.get('confirmPassword') || '');
	const invalid = passwordError(password, confirmation);
	if (invalid) return fail(400, { section: 'password', error: invalid });
	if (!current || current.length > 128) return fail(400, { section: 'password', error: 'Enter your current password.' });
	if (password === current) return fail(400, { section: 'password', error: 'Choose a different password.' });
	return db.transaction(async (tx) => {
		const [user] = await tx.select().from(users).where(eq(users.id, event.locals.user!.id)).for('update');
		if (!user || !verifyPassword(current, user.passwordHash)) return fail(400, { section: 'password', error: 'Your current password is incorrect.' });
		await tx.update(users).set({ passwordHash: hashPassword(password), updatedAt: new Date() }).where(eq(users.id, user.id));
		await tx.delete(sessions).where(and(eq(sessions.userId, user.id), ne(sessions.id, event.locals.session!.id)));
		await tx.update(passwordResets).set({ usedAt: new Date() }).where(eq(passwordResets.userId, user.id));
		return { section: 'password', success: 'Password changed. Other sessions have been signed out.' };
	});
}
const requests = new Map<string, { count: number; until: number }>();
export async function requestPasswordReset(event: RequestEvent, email: string, reportDeliveryFailure = false) {
	requireOrigin(event);
	const config = mailConfiguration();
	if (!config) error(503, 'Password recovery email is currently unavailable. Try again later.');
	const ip = event.getClientAddress();
	const now = Date.now();
	for (const [key, entry] of requests) if (entry.until < now) requests.delete(key);
	const rate = requests.get(ip) || { count: 0, until: now + 900000 };
	if (++rate.count > 10 || requests.size > 5000) error(429, 'Too many requests. Try again later.');
	requests.set(ip, rate);
	const message = 'If an account uses that email, check your inbox for a reset link. If it does not arrive, try again later.';
	const token = crypto.randomBytes(32).toString('hex');
	const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
	const user = await db.transaction(async (tx) => {
		const [user] = await tx.select({ id: users.id, email: users.email }).from(users).where(eq(users.email, email.toLowerCase().trim())).for('update');
		if (!user) return null;
		const [quota] = await tx.select({ count: sql<number>`count(*)::int`, latest: sql<Date | null>`max(${passwordResets.createdAt})` }).from(passwordResets).where(and(eq(passwordResets.userId, user.id), gt(passwordResets.createdAt, new Date(now - 3600000))));
		if (quota.count >= 5 || quota.latest && now - new Date(quota.latest).getTime() < 60000) return null;
		await tx.update(passwordResets).set({ usedAt: new Date() }).where(eq(passwordResets.userId, user.id));
		await tx.insert(passwordResets).values({ tokenHash, userId: user.id, expiresAt: new Date(now + 1800000) });
		return user;
	});
	if (user) {
		try { await sendEmail(user.email, 'Reset your SuriOS password', `Reset your password using this link:\n${config.origin}/reset-password#token=${token}\n\nThis link expires in 30 minutes and can be used once. If you did not request it, ignore this email.`); }
		catch {
			await db.delete(passwordResets).where(eq(passwordResets.tokenHash, tokenHash));
			if (reportDeliveryFailure) error(503, 'Password recovery email could not be delivered. Try again later.');
		}
	}
	return message;
}
export async function resetPasswordAction(event: RequestEvent) {
	requireOrigin(event);
	const form = await event.request.formData();
	const token = String(form.get('token') || '');
	const password = String(form.get('newPassword') || ''), confirmation = String(form.get('confirmPassword') || '');
	const invalid = passwordError(password, confirmation);
	if (invalid) return fail(400, { error: invalid });
	if (!/^[a-f0-9]{64}$/.test(token)) return fail(400, { error: 'This reset link is invalid or expired. Request a new one.' });
	const hash = crypto.createHash('sha256').update(token).digest('hex');
	const result = await db.transaction(async (tx) => {
		// Lock the account before its tokens, matching the request/change-password lock order.
		const [candidate] = await tx.select({ userId: passwordResets.userId }).from(passwordResets).where(eq(passwordResets.tokenHash, hash));
		if (!candidate) return false;
		await tx.select({ id: users.id }).from(users).where(eq(users.id, candidate.userId)).for('update');
		const [reset] = await tx.select().from(passwordResets).where(eq(passwordResets.tokenHash, hash)).for('update');
		if (!reset || reset.usedAt || reset.expiresAt.getTime() <= Date.now()) return false;
		await tx.update(users).set({ passwordHash: hashPassword(password), updatedAt: new Date() }).where(eq(users.id, reset.userId));
		await tx.update(passwordResets).set({ usedAt: new Date() }).where(eq(passwordResets.userId, reset.userId));
		await tx.delete(sessions).where(eq(sessions.userId, reset.userId));
		return true;
	});
	if (!result) return fail(400, { error: 'This reset link is invalid or expired. Request a new one.' });
	deleteSessionTokenCookie(event);
	return { success: 'Password reset. Sign in with your new password.' };
}
