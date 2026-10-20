import type { PageServerLoad } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { reports } from '$lib/server/db/schema.js';
import { desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	// Query recent civil reports from PostgreSQL
	const dbReports = await db
		.select()
		.from(reports)
		.orderBy(desc(reports.createdAt))
		.limit(20);

	return {
		user: locals.user,
		dbReports
	};
};
