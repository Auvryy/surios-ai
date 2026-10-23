import { error, fail } from '@sveltejs/kit';
import { asc, eq, ne } from 'drizzle-orm';
import { db, users, sessions } from '$lib/server/db';
import type { Actions, PageServerLoad } from './$types';
function requireAdmin(user: App.Locals['user']) {
	if (user?.role !== 'ADMIN' || user.accountStatus !== 'ACTIVE') error(403, 'Administrator access required.');
}
export const load: PageServerLoad = async ({ locals }) => {
	requireAdmin(locals.user);
	const accounts = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role, accountStatus: users.accountStatus, department: users.department, badgeNumber: users.badgeNumber, governmentProfile: users.governmentProfile, createdAt: users.createdAt }).from(users).where(ne(users.role, 'ADMIN')).orderBy(asc(users.createdAt));
	return { accounts };
};
export const actions: Actions = {
	update: async ({ request, locals }) => {
		requireAdmin(locals.user);
		const form = await request.formData();
		const id = String(form.get('id') || '');
		const action = String(form.get('decision') || '');
		if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) || !['approve', 'reject', 'activate', 'deactivate'].includes(action)) return fail(400, { error: 'Invalid account action.' });
		return db.transaction(async tx => {
			const [target] = await tx.select().from(users).where(eq(users.id, id)).for('update');
			if (!target || target.role === 'ADMIN') return fail(403, { error: 'This account cannot be changed here.' });
			const government = ['OFFICER', 'ENGINEER'].includes(target.role);
			const allowed = action === 'approve' || action === 'reject' ? government && target.accountStatus === 'PENDING' : action === 'activate' ? target.accountStatus === 'INACTIVE' : target.accountStatus === 'ACTIVE';
			if (!allowed) return fail(409, { error: 'The account status changed. Refresh and try again.' });
			const accountStatus = action === 'reject' ? 'REJECTED' : action === 'deactivate' ? 'INACTIVE' : 'ACTIVE';
			await tx.update(users).set({ accountStatus, updatedAt: new Date(), ...(['approve', 'reject'].includes(action) ? { reviewedAt: new Date(), reviewedBy: locals.user!.id } : {}) }).where(eq(users.id, id));
			if (accountStatus === 'INACTIVE' || accountStatus === 'REJECTED') await tx.delete(sessions).where(eq(sessions.userId, id));
			return { success: `${target.name}: ${accountStatus.toLowerCase()}.` };
		});
	}
};
