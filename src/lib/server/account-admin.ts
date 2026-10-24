import { error } from '@sveltejs/kit';
import { asc, eq, ne } from 'drizzle-orm';
import { z } from 'zod';
import { db, users, sessions, type User } from './db';

export function requireAdministrator(user: User | null) {
	if (user?.role !== 'ADMIN' || user.accountStatus !== 'ACTIVE') error(403, 'Administrator access required.');
	return user;
}

export async function loadAccountAdministration(user: User | null) {
	requireAdministrator(user);
	const accounts = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role, accountStatus: users.accountStatus, department: users.department, badgeNumber: users.badgeNumber, governmentProfile: users.governmentProfile, createdAt: users.createdAt }).from(users).where(ne(users.role, 'ADMIN')).orderBy(asc(users.createdAt));
	return { accounts };
}

export const accountDecisionSchema = z.object({ id: z.uuid(), decision: z.enum(['approve', 'reject', 'activate', 'deactivate']) }).strict();
export async function decideAccount(user: User | null, input: z.output<typeof accountDecisionSchema>) {
	const administrator = requireAdministrator(user);
	return db.transaction(async (tx) => {
		const [target] = await tx.select().from(users).where(eq(users.id, input.id)).for('update');
		if (!target || target.role === 'ADMIN') error(403, 'This account cannot be changed here.');
		const government = ['OFFICER', 'ENGINEER'].includes(target.role);
		const allowed = input.decision === 'approve' || input.decision === 'reject' ? government && target.accountStatus === 'PENDING' : input.decision === 'activate' ? target.accountStatus === 'INACTIVE' : target.accountStatus === 'ACTIVE';
		if (!allowed) error(409, 'The account status changed. Refresh and try again.');
		const accountStatus = input.decision === 'reject' ? 'REJECTED' : input.decision === 'deactivate' ? 'INACTIVE' : 'ACTIVE';
		await tx.update(users).set({ accountStatus, updatedAt: new Date(), ...(['approve', 'reject'].includes(input.decision) ? { reviewedAt: new Date(), reviewedBy: administrator.id } : {}) }).where(eq(users.id, target.id));
		if (accountStatus === 'INACTIVE' || accountStatus === 'REJECTED') await tx.delete(sessions).where(eq(sessions.userId, target.id));
		return { success: `${target.name}: ${accountStatus.toLowerCase()}.`, account: { id: target.id, accountStatus } };
	});
}
