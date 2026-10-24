import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db, users, type User } from './db';
import { emailPreferences, mailConfiguration } from './email';

export const settingsPatchSchema = z.object({
	emailComments: z.boolean().optional(),
	emailConfirmations: z.boolean().optional(),
	theme: z.enum(['light', 'dark', 'system']).optional()
}).strict().refine((value) => Object.keys(value).length > 0, 'Choose a preference to update.');

export function accountSettings(user: User) {
	return { preferences: { ...emailPreferences(user.settings), theme: user.settings?.theme || 'light' }, email: user.email, mailAvailable: !!mailConfiguration() };
}

export async function saveAccountSettings(userId: string, preferences: z.output<typeof settingsPatchSchema>) {
	const [user] = await db.update(users).set({ settings: sql`coalesce(${users.settings}, '{}'::jsonb) || ${JSON.stringify(preferences)}::jsonb`, updatedAt: new Date() }).where(eq(users.id, userId)).returning();
	return accountSettings(user);
}
