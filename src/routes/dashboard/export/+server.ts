import { desc, eq, isNotNull } from 'drizzle-orm';
import { db, communityPosts, reports, users } from '$lib/server/db';
import { communityReposts } from '$lib/server/db/community-social-schema';
import { csvCell, requireGovernmentUser } from '$lib/server/work-orders';
import { budgetTotal } from '$lib/types/community';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	requireGovernmentUser(event);
	const updates = await db.select({ quote: communityReposts, post: communityPosts, status: reports.status, office: users.name })
		.from(communityReposts).innerJoin(communityPosts, eq(communityPosts.id, communityReposts.postId))
		.innerJoin(reports, eq(reports.id, communityPosts.reportId)).innerJoin(users, eq(users.id, communityReposts.userId))
		.where(isNotNull(communityReposts.governmentUpdate)).orderBy(desc(communityReposts.createdAt));
	const headers = ['Update ID', 'Report ID', 'Original post', 'Office', 'Update status', 'Current report status', 'Details', 'Budget type', 'Budget PHP', 'Budget breakdown', 'Evidence', 'Posted at'];
	const rows = updates.map(({ quote, post, status, office }) => {
		const update = quote.governmentUpdate!;
		return [quote.id, post.reportId, post.title, office, update.status, status, quote.body, update.budget.length ? update.budgetType : '', update.budget.length ? budgetTotal(update.budget) : '', update.budget.map((item) => `${item.label}: ${item.amount.toFixed(2)}`).join('; '), update.attachments.map((file) => file.url).join('; '), quote.createdAt.toISOString()];
	});
	return new Response('\uFEFF' + [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n'), { headers: {
		'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="surios-government-updates-${new Date().toISOString().slice(0, 10)}.csv"`,
		'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff'
	} });
};
