import postgres from 'postgres';
import { randomBytes, scryptSync } from 'node:crypto';

const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD || '';
const demoPassword = process.env.DEMO_ACCOUNT_PASSWORD || 'Password123!';
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!emailPattern.test(adminEmail) || adminEmail.length > 254) {
	throw new Error('Set ADMIN_EMAIL to a valid email address.');
}
if (['citizen@surios.gov', 'municipality@surios.gov'].includes(adminEmail)) {
	throw new Error('ADMIN_EMAIL must differ from the seeded citizen and municipality emails.');
}
if (adminPassword.length < 12 || adminPassword.length > 256) {
	throw new Error('ADMIN_PASSWORD must contain 12–256 characters.');
}
if (demoPassword.length < 8 || demoPassword.length > 256) {
	throw new Error('DEMO_ACCOUNT_PASSWORD must contain 8–256 characters.');
}

const sql = postgres(process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5433/surios', { max: 1 });

function passwordHash(password) {
	const salt = randomBytes(16).toString('hex');
	return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}

async function ensureAccount(tx, account) {
	const [existing] = await tx`select id, role, account_status from users where email = ${account.email}`;
	if (existing) {
		if (existing.role !== account.role || existing.account_status !== 'ACTIVE') {
			throw new Error(`Seed account ${account.email} already exists with a different or inactive role.`);
		}
		await tx`update users set email_verified_at = coalesce(email_verified_at, now()) where id = ${existing.id}`;
		console.log(`Kept ${account.role} account ${account.email}; password unchanged.`);
		return;
	}

	const profile = account.governmentProfile ? tx.json(account.governmentProfile) : null;
	await tx`
		insert into users (email, name, password_hash, role, account_status, email_verified_at, department, government_profile)
		values (
			${account.email}, ${account.name}, ${passwordHash(account.password)}, ${account.role}, 'ACTIVE', now(),
			${account.department || null}, ${profile}
		)
	`;
	console.log(`Created ${account.role} account ${account.email}.`);
}

try {
	await sql.begin(async (tx) => {
		await tx`select pg_advisory_xact_lock(76489218)`;
		await ensureAccount(tx, {
			email: 'citizen@surios.gov',
			name: 'SuriOS Community Member',
			role: 'CITIZEN',
			password: demoPassword
		});
		await ensureAccount(tx, {
			email: 'municipality@surios.gov',
			name: 'Demo · Santa Cruz Municipal Office',
			role: 'ENGINEER',
			department: 'Municipality of Santa Cruz',
			governmentProfile: { level: 'MUNICIPAL', jurisdiction: 'Santa Cruz, Laguna', bio: '' },
			password: demoPassword
		});
		await ensureAccount(tx, {
			email: adminEmail,
			name: 'SuriOS Administrator',
			role: 'ADMIN',
			password: adminPassword
		});
	});
	console.log('Account-only seed complete. No posts, reports, or presentation content were added.');
} finally {
	await sql.end();
}
