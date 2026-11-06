import { error } from '@sveltejs/kit';
import { eq, lt } from 'drizzle-orm';
import type { GovernmentProfile } from '$lib/types/community';
import { db, pendingRegistrations, users, type User } from './db';
import { hashPassword } from './auth';
import { createEmailCode, EMAIL_CODE_MAX_ATTEMPTS, EMAIL_CODE_TTL_MS, matchesEmailCode } from './otp';
import { mailConfiguration, sendEmail } from './email';
import { requestVerificationEmail } from './email-verification';
import type { registrationSchema } from './accounts';
import type { z } from 'zod';

const RESEND_MIN_INTERVAL_MS = 60_000;
const RESEND_WINDOW_MS = 60 * 60_000;
const MAX_SENDS_PER_WINDOW = 5;

export function emailOtpAvailable() {
	return mailConfiguration() !== null;
}

function codeEmail(code: string) {
	return `Your SuriOS verification code is ${code}.\n\nEnter this 6-digit code to finish creating your account. It expires in 10 minutes and can be used once. If you did not create a SuriOS account, ignore this email.`;
}

async function sendRegistrationCode(email: string, code: string) {
	await sendEmail(email, 'Your SuriOS verification code', codeEmail(code));
}

export async function startRegistrationCode(value: z.output<typeof registrationSchema>) {
	if (!emailOtpAvailable()) error(503, 'Email verification is currently unavailable. Please try again later.');
	const normalized = value.email.trim().toLowerCase();
	const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, normalized)).limit(1);
	if (existing) error(409, 'An account with this email address already exists.');

	const now = Date.now();
	const challenge = createEmailCode();
	const government = value.role === 'OFFICER';
	const pendingResult = await db.transaction(async (tx) => {
		await tx.delete(pendingRegistrations).where(lt(pendingRegistrations.expiresAt, new Date(now - RESEND_WINDOW_MS)));
		const [pending] = await tx.select().from(pendingRegistrations).where(eq(pendingRegistrations.email, normalized)).for('update');
		const withinWindow = !!pending && now - pending.sentWindowStartedAt.getTime() < RESEND_WINDOW_MS;
		const quotaReached = !!pending && withinWindow && pending.sentCount >= MAX_SENDS_PER_WINDOW;
		if (pending && pending.expiresAt.getTime() > now && (now - pending.lastSentAt.getTime() < RESEND_MIN_INTERVAL_MS || quotaReached)) return { id: pending.id, send: false };
		if (pending && quotaReached) error(429, 'Too many verification codes were requested. Try again later.');
		const values = {
			email: normalized, name: value.name, passwordHash: hashPassword(value.password), role: value.role,
			department: government ? value.department : null,
			badgeNumber: government ? value.badgeNumber : null,
			governmentProfile: government ? { level: value.level, jurisdiction: value.jurisdiction, bio: '' } : null,
			codeHash: challenge.hash, codeSalt: challenge.salt,
			expiresAt: new Date(now + EMAIL_CODE_TTL_MS), attempts: 0,
			sentCount: pending && now - pending.sentWindowStartedAt.getTime() < RESEND_WINDOW_MS ? pending.sentCount + 1 : 1,
			sentWindowStartedAt: pending && now - pending.sentWindowStartedAt.getTime() < RESEND_WINDOW_MS ? pending.sentWindowStartedAt : new Date(now),
			lastSentAt: new Date(now)
		};
		if (pending) {
			const [updated] = await tx.update(pendingRegistrations).set(values).where(eq(pendingRegistrations.id, pending.id)).returning({ id: pendingRegistrations.id });
			return { id: updated.id, send: true };
		}
		const [created] = await tx.insert(pendingRegistrations).values(values).returning({ id: pendingRegistrations.id });
		return { id: created.id, send: true };
	});
	if (!pendingResult.send) return { email: normalized };
	try {
		await sendRegistrationCode(normalized, challenge.code);
	} catch {
		await db.delete(pendingRegistrations).where(eq(pendingRegistrations.id, pendingResult.id));
		error(503, 'The verification code could not be sent. Please try again.');
	}
	return { email: normalized };
}

export async function resendRegistrationCode(email: string) {
	const normalized = email.trim().toLowerCase();
	if (!emailOtpAvailable()) error(503, 'Email verification is currently unavailable. Please try again later.');
	const challenge = createEmailCode();
	const now = Date.now();
	const updated = await db.transaction(async (tx) => {
		const [pending] = await tx.select().from(pendingRegistrations).where(eq(pendingRegistrations.email, normalized)).for('update');
		if (!pending) return false;
		if (now - pending.lastSentAt.getTime() < RESEND_MIN_INTERVAL_MS) error(429, 'Please wait a minute before requesting another code.');
		const withinWindow = now - pending.sentWindowStartedAt.getTime() < RESEND_WINDOW_MS;
		if (withinWindow && pending.sentCount >= MAX_SENDS_PER_WINDOW) error(429, 'Too many verification codes were requested. Try again later.');
		await tx.update(pendingRegistrations).set({
			codeHash: challenge.hash, codeSalt: challenge.salt, expiresAt: new Date(now + EMAIL_CODE_TTL_MS), attempts: 0,
			sentCount: withinWindow ? pending.sentCount + 1 : 1,
			sentWindowStartedAt: withinWindow ? pending.sentWindowStartedAt : new Date(now),
			lastSentAt: new Date(now)
		}).where(eq(pendingRegistrations.id, pending.id));
		return true;
	});
	if (!updated) return requestVerificationEmail(normalized);
	try {
		await sendRegistrationCode(normalized, challenge.code);
	} catch {
		error(503, 'The verification code could not be sent. Please try again.');
	}
	return 'A new verification code was sent if a pending registration uses that email.';
}

export async function confirmRegistrationCode(email: string, code: string): Promise<User> {
	const normalized = email.trim().toLowerCase();
	const result = await db.transaction(async (tx) => {
		const [pending] = await tx.select().from(pendingRegistrations).where(eq(pendingRegistrations.email, normalized)).for('update');
		if (!pending) return { error: 'missing' as const };
		if (pending.expiresAt.getTime() <= Date.now()) {
			await tx.delete(pendingRegistrations).where(eq(pendingRegistrations.id, pending.id));
			return { error: 'expired' as const };
		}
		if (pending.attempts >= EMAIL_CODE_MAX_ATTEMPTS) return { error: 'attempts' as const };
		if (!matchesEmailCode(code, pending.codeSalt, pending.codeHash)) {
			await tx.update(pendingRegistrations).set({ attempts: pending.attempts + 1 }).where(eq(pendingRegistrations.id, pending.id));
			return { error: 'invalid' as const };
		}
		const [user] = await tx.insert(users).values({
			name: pending.name, email: pending.email, passwordHash: pending.passwordHash,
			role: pending.role, accountStatus: pending.role === 'OFFICER' ? 'PENDING' : 'ACTIVE', emailVerifiedAt: new Date(),
			department: pending.department, badgeNumber: pending.badgeNumber,
			governmentProfile: pending.governmentProfile as GovernmentProfile | null
		}).onConflictDoNothing({ target: users.email }).returning();
		await tx.delete(pendingRegistrations).where(eq(pendingRegistrations.id, pending.id));
		return user ? { user } : { error: 'exists' as const };
	});
	if ('error' in result) {
		if (result.error === 'exists') error(409, 'An account with this email address already exists.');
		if (result.error === 'missing') error(400, 'This registration request could not be found. Please start again.');
		if (result.error === 'expired') error(400, 'This code expired. Request a new one.');
		if (result.error === 'attempts') error(429, 'Too many incorrect codes. Request a new code.');
		error(400, 'That verification code is incorrect. Try again.');
	}
	return result.user;
}
