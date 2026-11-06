import crypto from 'node:crypto';

export const EMAIL_CODE_TTL_MS = 10 * 60 * 1000;
export const EMAIL_CODE_MAX_ATTEMPTS = 5;

export function createEmailCode() {
	const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
	const salt = crypto.randomBytes(16).toString('hex');
	return { code, salt, hash: hashEmailCode(code, salt) };
}

export function hashEmailCode(code: string, salt: string) {
	return crypto.scryptSync(code, salt, 32).toString('hex');
}

export function matchesEmailCode(code: string, salt: string, expectedHash: string) {
	const actual = Buffer.from(hashEmailCode(code, salt), 'hex');
	const expected = Buffer.from(expectedHash, 'hex');
	return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}
