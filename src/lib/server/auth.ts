import crypto from 'node:crypto';
import type { RequestEvent } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from './db/index.js';
import { users, sessions, type User, type Session } from './db/schema.js';

const SESSION_COOKIE_NAME = 'surios_session';
const SESSION_EXPIRY_DAYS = 30;

/**
 * Generates a cryptographic scrypt hash for the password with a random 16-byte salt.
 * Formatted as: `${salt}:${hash}`
 */
export function hashPassword(password: string): string {
	const salt = crypto.randomBytes(16).toString('hex');
	const derivedKey = crypto.scryptSync(password, salt, 64);
	return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Constant-time password verification to prevent timing attacks.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
	const parts = storedHash.split(':');
	if (parts.length !== 2) return false;
	const [salt, originalKey] = parts;

	try {
		const keyBuffer = Buffer.from(originalKey, 'hex');
		const derivedKey = crypto.scryptSync(password, salt, 64);
		return crypto.timingSafeEqual(keyBuffer, derivedKey);
	} catch {
		return false;
	}
}

/**
 * Generates a cryptographically secure random session token.
 */
export function generateSessionToken(): string {
	return crypto.randomBytes(32).toString('hex');
}

/**
 * Creates a database session record for the user.
 */
export async function createSession(
	token: string,
	userId: string,
	metadata?: { ipAddress?: string; userAgent?: string }
): Promise<Session> {
	const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * SESSION_EXPIRY_DAYS);

	const [session] = await db
		.insert(sessions)
		.values({
			id: token,
			userId,
			expiresAt,
			ipAddress: metadata?.ipAddress,
			userAgent: metadata?.userAgent
		})
		.returning();

	return session;
}

export type SessionValidationResult =
	| { session: Session; user: User }
	| { session: null; user: null };

/**
 * Validates a session token, checks expiration, and auto-renews if approaching expiration.
 */
export async function validateSessionToken(token: string): Promise<SessionValidationResult> {
	const result = await db
		.select({
			session: sessions,
			user: users
		})
		.from(sessions)
		.innerJoin(users, eq(sessions.userId, users.id))
		.where(eq(sessions.id, token))
		.limit(1);

	if (result.length === 0) {
		return { session: null, user: null };
	}

	const { session, user } = result[0];

	// Expired session check
	if (Date.now() >= session.expiresAt.getTime()) {
		await db.delete(sessions).where(eq(sessions.id, token));
		return { session: null, user: null };
	}

	// Auto-renew session if less than 15 days remaining
	if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
		session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * SESSION_EXPIRY_DAYS);
		await db
			.update(sessions)
			.set({ expiresAt: session.expiresAt })
			.where(eq(sessions.id, session.id));
	}

	return { session, user };
}

/**
 * Invalidates (deletes) a single session.
 */
export async function invalidateSession(sessionId: string): Promise<void> {
	await db.delete(sessions).where(eq(sessions.id, sessionId));
}

/**
 * Sets the secure session cookie in the client response.
 */
export function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date): void {
	event.cookies.set(SESSION_COOKIE_NAME, token, {
		httpOnly: true,
		sameSite: 'lax',
		expires: expiresAt,
		path: '/',
		secure: process.env.NODE_ENV === 'production'
	});
}

/**
 * Removes the session cookie from the client.
 */
export function deleteSessionTokenCookie(event: RequestEvent): void {
	event.cookies.delete(SESSION_COOKIE_NAME, {
		path: '/'
	});
}

/**
 * Seeds initial municipal accounts if the database has zero registered users.
 * Provides instant test credentials for Engineers, Field Inspectors, and Citizens.
 */
export async function ensureInitialSeedUsers(): Promise<void> {
	try {
		const existingUsers = await db.select().from(users).limit(1);
		if (existingUsers.length > 0) return;

		console.log('[SuriOS Auth] Initializing municipal test accounts...');
		const defaultPassword = 'Password123!';
		const sharedPasswordHash = hashPassword(defaultPassword);

		await db.insert(users).values([
			{
				email: 'engineer@surios.gov',
				name: 'Engr. Maria Santos',
				passwordHash: sharedPasswordHash,
				role: 'ENGINEER',
				department: 'Santa Cruz Municipal Engineering Office',
				badgeNumber: 'SC-MEO-041'
			},
			{
				email: 'inspector@surios.gov',
				name: 'Insp. Juan Reyes',
				passwordHash: sharedPasswordHash,
				role: 'OFFICER',
				department: 'Laguna Traffic Management & VRU Safety Unit',
				badgeNumber: 'LTMO-VRU-108'
			},
			{
				email: 'citizen@surios.gov',
				name: 'Alex Cruz',
				passwordHash: sharedPasswordHash,
				role: 'CITIZEN',
				department: 'Barangay Poblacion I Resident',
				badgeNumber: null
			}
		]);

		console.log('[SuriOS Auth] Seeded 3 municipal accounts (Password: Password123!).');
	} catch (error) {
		console.error('[SuriOS Auth] Error checking/seeding initial users:', error);
	}
}
