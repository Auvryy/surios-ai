import postgres from 'postgres';
import { randomBytes, scryptSync } from 'node:crypto';
const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || '';
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new Error('Set ADMIN_EMAIL to a valid email address.');
if (password.length < 12 || password.length > 256) throw new Error('ADMIN_PASSWORD must contain 12–256 characters.');
const sql = postgres(process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5433/surios', { max: 1 });
try {
	await sql.begin(async tx => {
		await tx`select pg_advisory_xact_lock(76489216)`;
		const [existing] = await tx`select role, account_status from users where email = ${email}`;
		if (existing) {
			if (existing.role !== 'ADMIN' || existing.account_status !== 'ACTIVE') throw new Error('That email belongs to another or inactive account. Choose a different administrator email.');
			console.log('Administrator already exists. Password and account were retained.');
			return;
		}
		const salt = randomBytes(16).toString('hex');
		const hash = `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
		await tx`insert into users (email,name,password_hash,role,account_status) values (${email}, 'SuriOS Administrator', ${hash}, 'ADMIN', 'ACTIVE')`;
		console.log('Administrator created. Sign in with the email and password you supplied; open /admin.');
	});
} finally { await sql.end(); }
