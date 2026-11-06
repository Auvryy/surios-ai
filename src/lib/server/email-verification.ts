import crypto from 'node:crypto';
import { error, isHttpError } from '@sveltejs/kit';
import { and, eq, gte, isNull, ne, sql } from 'drizzle-orm';
import { db, emailVerificationTokens, users } from './db';
import { mailConfiguration, sendEmail } from './email';

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const RESEND_WINDOW_MS = 60 * 60 * 1000;
const RESEND_MIN_INTERVAL_MS = 60 * 1000;
const MAX_EMAILS_PER_WINDOW = 5;
const GENERIC_RESEND_MESSAGE = 'If an unverified SuriOS account uses that email, check the inbox for a verification link.';

export function emailVerificationAvailable() {
	return mailConfiguration() !== null;
}

export async function sendVerificationEmail(userId: string) {
	const config = mailConfiguration();
	if (!config) error(503, 'Email verification is currently unavailable. Please try again later.');

	const token = crypto.randomBytes(32).toString('hex');
	const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
	const now = Date.now();
	const recipient = await db.transaction(async (tx) => {
		const [user] = await tx.select({ id: users.id, email: users.email, emailVerifiedAt: users.emailVerifiedAt }).from(users).where(eq(users.id, userId)).for('update');
		if (!user || user.emailVerifiedAt) return null;
		const [quota] = await tx.select({ count: sql<number>`count(*)::int`, latest: sql<Date | null>`max(${emailVerificationTokens.createdAt})` })
			.from(emailVerificationTokens)
			.where(and(eq(emailVerificationTokens.userId, user.id), gte(emailVerificationTokens.createdAt, new Date(now - RESEND_WINDOW_MS))));
		if (quota.count >= MAX_EMAILS_PER_WINDOW || quota.latest && now - new Date(quota.latest).getTime() < RESEND_MIN_INTERVAL_MS) {
			error(429, 'Please wait before requesting another verification email.');
		}
		await tx.insert(emailVerificationTokens).values({ tokenHash, userId: user.id, expiresAt: new Date(now + TOKEN_TTL_MS) });
		return user.email;
	});
	if (!recipient) return false;

	const link = new URL('/verify-email', config.origin);
	link.searchParams.set('token', token);
	try {
		await sendEmail(recipient, 'Verify your SuriOS email address', `Confirm your email address to finish creating your SuriOS account:\n\n${link.toString()}\n\nThis link expires in 24 hours and can be used once. If you did not create a SuriOS account, ignore this email.`);
	} catch {
		await db.update(emailVerificationTokens).set({ usedAt: new Date() }).where(eq(emailVerificationTokens.tokenHash, tokenHash));
		error(503, 'Your account was created, but the verification email could not be sent. Try again later or request another link from the verification page.');
	}
	await db.update(emailVerificationTokens).set({ usedAt: new Date() }).where(and(eq(emailVerificationTokens.userId, userId), isNull(emailVerificationTokens.usedAt), ne(emailVerificationTokens.tokenHash, tokenHash)));
	return true;
}

export async function requestVerificationEmail(email: string) {
	if (!mailConfiguration()) error(503, 'Email verification is currently unavailable. Please try again later.');
	const normalized = email.trim().toLowerCase();
	const [user] = await db.select({ id: users.id, emailVerifiedAt: users.emailVerifiedAt }).from(users).where(eq(users.email, normalized)).limit(1);
	if (user && !user.emailVerifiedAt) {
		try { await sendVerificationEmail(user.id); }
		catch (cause) {
			if (isHttpError(cause) && cause.status === 429) return GENERIC_RESEND_MESSAGE;
			if (isHttpError(cause) && cause.status === 503) {
				console.warn('[Email Verification] Delivery could not be completed.');
				return GENERIC_RESEND_MESSAGE;
			}
			throw cause;
		}
	}
	return GENERIC_RESEND_MESSAGE;
}

export async function verifyEmailToken(token: string) {
	if (!/^[a-f0-9]{64}$/.test(token)) return false;
	const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
	return db.transaction(async (tx) => {
		const [candidate] = await tx.select({ userId: emailVerificationTokens.userId }).from(emailVerificationTokens).where(eq(emailVerificationTokens.tokenHash, tokenHash));
		if (!candidate) return false;
		await tx.select({ id: users.id }).from(users).where(eq(users.id, candidate.userId)).for('update');
		const [stored] = await tx.select().from(emailVerificationTokens).where(eq(emailVerificationTokens.tokenHash, tokenHash)).for('update');
		if (!stored || stored.usedAt || stored.expiresAt.getTime() <= Date.now()) return false;
		const [user] = await tx.select({ emailVerifiedAt: users.emailVerifiedAt }).from(users).where(eq(users.id, stored.userId)).for('update');
		if (!user) return false;
		if (!user.emailVerifiedAt) await tx.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.id, stored.userId));
		await tx.update(emailVerificationTokens).set({ usedAt: new Date() }).where(and(eq(emailVerificationTokens.userId, stored.userId), isNull(emailVerificationTokens.usedAt)));
		return true;
	});
}
